import { NextRequest } from "next/server";
import sql from "@/lib/db";
import OpenAI from "openai";
import { TICKER_SLUGS } from "@/lib/tickers";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

  // Lookup mode: /api/ai-recommendation?date=2024-08-22&ticker=TSLA
  if (dateParam && tickerParam) {
    try {
      const rows = await sql`
        SELECT recommendation, reasoning, eod_date, close_price, generated_at, ticker
        FROM ai_recommendations
        WHERE eod_date = ${dateParam} AND ticker = ${tickerParam}
        LIMIT 1
      `;
      if (rows.length > 0) {
        return Response.json({
          ticker: rows[0].ticker,
          recommendation: rows[0].recommendation,
          reasoning: rows[0].reasoning,
          date: rows[0].eod_date,
          closePrice: rows[0].close_price,
          generatedAt: rows[0].generated_at,
        });
      }
      return Response.json({ error: "No recommendation for this ticker/date" }, { status: 404 });
    } catch {
      return Response.json({ error: "Database error" }, { status: 500 });
    }
  }

  // Cron mode: no params — generate recommendations for ALL tickers
  try {
    const baseUrl = request.nextUrl.origin;
    const eodRes = await fetch(`${baseUrl}/api/eod`, { next: { revalidate: 0 } });
    if (!eodRes.ok) throw new Error("Failed to fetch EOD data");
    const eodData: EODResponse = await eodRes.json();

    const marketSummary = eodData.tickers
      .map((t) => `${t.ticker}: $${t.close} (${t.changePct >= 0 ? "+" : ""}${t.changePct}%)`)
      .join("\n");

    const results: { ticker: string; recommendation: string; status: string }[] = [];

    for (const symbol of TICKER_SLUGS) {
      const tickerData = eodData.tickers.find((t) => t.ticker === symbol);
      if (!tickerData) {
        results.push({ ticker: symbol, recommendation: "", status: "no_data" });
        continue;
      }

      // Skip if already exists
      const existing = await sql`
        SELECT id FROM ai_recommendations WHERE ticker = ${symbol} AND eod_date = ${tickerData.date} LIMIT 1
      `;
      if (existing.length > 0) {
        results.push({ ticker: symbol, recommendation: "", status: "already_exists" });
        continue;
      }

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
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
          INSERT INTO ai_recommendations (ticker, eod_date, recommendation, reasoning, close_price)
          VALUES (${symbol}, ${tickerData.date}, ${parsed.recommendation}, ${parsed.reasoning}, ${tickerData.close})
          ON CONFLICT (ticker, eod_date) DO NOTHING
        `;

        results.push({ ticker: symbol, recommendation: parsed.recommendation, status: "created" });
      } catch (err) {
        console.error(`AI recommendation error for ${symbol}:`, err);
        results.push({ ticker: symbol, recommendation: "", status: "error" });
      }
    }

    return Response.json({ status: "done", results });
  } catch (error) {
    console.error("AI recommendation cron error:", error);
    return Response.json({ error: "Failed to generate recommendations" }, { status: 500 });
  }
}
