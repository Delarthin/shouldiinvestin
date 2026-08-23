import { NextRequest } from "next/server";
import sql from "@/lib/db";
import OpenAI from "openai";
import { TICKER_SLUGS } from "@/lib/tickers";

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const AI_MODELS = [
  { id: "openai/gpt-4o-mini", label: "gpt-4o-mini" },
  { id: "anthropic/claude-haiku-4.5", label: "claude-haiku-4.5" },
  { id: "google/gemini-3.5-flash", label: "gemini-3.5-flash" },
];

interface TickerData {
  ticker: string;
  close: number;
  prevClose: number;
  change: number;
  changePct: number;
  date: string;
}

interface EODResponse {
  tickers: TickerData[];
}

export async function GET(request: NextRequest) {
  const dateParam = request.nextUrl.searchParams.get("date");
  const tickerParam = request.nextUrl.searchParams.get("ticker")?.toUpperCase();

  // Lookup mode: /api/ai-recommendation?date=...&ticker=...
  if (dateParam && tickerParam) {
    try {
      const rows = await sql`
        SELECT recommendation, reasoning, eod_date, close_price, generated_at, ticker, model
        FROM ai_recommendations
        WHERE eod_date = ${dateParam} AND ticker = ${tickerParam}
        ORDER BY model
      `;
      if (rows.length > 0) {
        return Response.json({
          ticker: tickerParam,
          date: rows[0].eod_date,
          models: rows.map((r) => ({
            model: r.model,
            recommendation: r.recommendation,
            reasoning: r.reasoning,
          })),
        });
      }
      return Response.json({ error: "No recommendation for this ticker/date" }, { status: 404 });
    } catch {
      return Response.json({ error: "Database error" }, { status: 500 });
    }
  }

  // Cron mode: generate for ALL tickers × ALL models
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const baseUrl = request.nextUrl.origin;
    const eodRes = await fetch(`${baseUrl}/api/eod`, { next: { revalidate: 0 } });
    if (!eodRes.ok) throw new Error("Failed to fetch EOD data");
    const eodData: EODResponse = await eodRes.json();

    const marketSummary = eodData.tickers
      .map((t) => `${t.ticker}: $${t.close} (${t.changePct >= 0 ? "+" : ""}${t.changePct}%)`)
      .join("\n");

    const results: { ticker: string; model: string; recommendation: string; status: string }[] = [];
    const failed: { ticker: string; model: typeof AI_MODELS[number] }[] = [];

    async function generateOne(symbol: string, model: typeof AI_MODELS[number], tickerData: TickerData) {
      const existing = await sql`
        SELECT id FROM ai_recommendations WHERE ticker = ${symbol} AND eod_date = ${tickerData.date} AND model = ${model.label} LIMIT 1
      `;
      if (existing.length > 0) {
        results.push({ ticker: symbol, model: model.label, recommendation: "", status: "already_exists" });
        return;
      }

      const completion = await openrouter.chat.completions.create({
        model: model.id,
        messages: [
          {
            role: "system",
            content: `You are a market analyst providing a daily BUY or SELL recommendation for ${symbol} for the next trading day. You must respond with valid JSON only, no markdown. Use this exact format:
{"recommendation": "BUY" or "SELL", "reasoning": "2-3 sentence explanation"}

Base your analysis on the provided end-of-day market data. Consider momentum, sector performance, and risk signals. Be concise and direct.`,
          },
          {
            role: "user",
            content: `End-of-day market data for ${tickerData.date}:\n\n${marketSummary}\n\n${symbol} closed at $${tickerData.close}, ${tickerData.changePct >= 0 ? "up" : "down"} ${Math.abs(tickerData.changePct)}% from the previous close.\n\nProvide your BUY or SELL recommendation for ${symbol} for the next trading day.`,
          },
        ],
        temperature: 0.3,
      });

      const content = completion.choices[0]?.message?.content?.trim();
      if (!content) throw new Error("No response");

      const parsed = JSON.parse(content);

      await sql`
        INSERT INTO ai_recommendations (ticker, eod_date, recommendation, reasoning, close_price, model)
        VALUES (${symbol}, ${tickerData.date}, ${parsed.recommendation}, ${parsed.reasoning}, ${tickerData.close}, ${model.label})
        ON CONFLICT DO NOTHING
      `;

      results.push({ ticker: symbol, model: model.label, recommendation: parsed.recommendation, status: "created" });
    }

    // First pass: all tickers × all models
    for (const symbol of TICKER_SLUGS) {
      const tickerData = eodData.tickers.find((t) => t.ticker === symbol);
      if (!tickerData) {
        results.push({ ticker: symbol, model: "", recommendation: "", status: "no_data" });
        continue;
      }

      for (const model of AI_MODELS) {
        try {
          await generateOne(symbol, model, tickerData);
        } catch (err) {
          console.error(`Error ${model.label} for ${symbol}:`, err);
          failed.push({ ticker: symbol, model });
        }
      }
    }

    // Retry failed after 3 minutes
    if (failed.length > 0) {
      console.log(`Retrying ${failed.length} failed calls after 3 min`);
      await new Promise((resolve) => setTimeout(resolve, 180000));

      for (const { ticker: symbol, model } of failed) {
        const tickerData = eodData.tickers.find((t) => t.ticker === symbol);
        if (!tickerData) continue;
        try {
          await generateOne(symbol, model, tickerData);
        } catch (err) {
          console.error(`Retry failed ${model.label} for ${symbol}:`, err);
          results.push({ ticker: symbol, model: model.label, recommendation: "", status: "error" });
        }
      }
    }

    return Response.json({ status: "done", results });
  } catch (error) {
    console.error("AI recommendation cron error:", error);
    return Response.json({ error: "Failed to generate recommendations" }, { status: 500 });
  }
}
