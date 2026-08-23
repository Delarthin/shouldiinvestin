import { NextRequest } from "next/server";
import sql from "@/lib/db";
import OpenAI from "openai";

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

  // If called with a date, return the stored recommendation for that date
  if (dateParam) {
    try {
      const rows = await sql`
        SELECT recommendation, reasoning, eod_date, spy_close, generated_at
        FROM ai_recommendations
        WHERE eod_date = ${dateParam}
        LIMIT 1
      `;
      if (rows.length > 0) {
        return Response.json({
          recommendation: rows[0].recommendation,
          reasoning: rows[0].reasoning,
          date: rows[0].eod_date,
          spyClose: rows[0].spy_close,
          generatedAt: rows[0].generated_at,
        });
      }
      return Response.json({ error: "No recommendation for this date" }, { status: 404 });
    } catch {
      return Response.json({ error: "Database error" }, { status: 500 });
    }
  }

  // No date param = cron trigger — generate today's recommendation
  try {
    const baseUrl = request.nextUrl.origin;
    const eodRes = await fetch(`${baseUrl}/api/eod`, { next: { revalidate: 0 } });
    if (!eodRes.ok) throw new Error("Failed to fetch EOD data");
    const eodData: EODResponse = await eodRes.json();

    const spy = eodData.tickers.find((t) => t.ticker === "SPY");
    if (!spy) throw new Error("SPY data not found");

    // Check if we already have a recommendation for this date
    const existing = await sql`
      SELECT id FROM ai_recommendations WHERE eod_date = ${spy.date} LIMIT 1
    `;
    if (existing.length > 0) {
      return Response.json({ status: "already exists", date: spy.date });
    }

    // Build context from market data
    const marketSummary = eodData.tickers
      .map((t) => `${t.ticker}: $${t.close} (${t.changePct >= 0 ? "+" : ""}${t.changePct}%)`)
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a market analyst providing a daily BUY or SELL recommendation for SPY (S&P 500 ETF) for the next trading day. You must respond with valid JSON only, no markdown. Use this exact format:
{"recommendation": "BUY" or "SELL", "reasoning": "2-3 sentence explanation"}

Base your analysis on the provided end-of-day market data. Consider momentum, breadth, sector performance, and risk signals. Be concise and direct.`,
        },
        {
          role: "user",
          content: `End-of-day market data for ${spy.date}:\n\n${marketSummary}\n\nSPY closed at $${spy.close}, ${spy.changePct >= 0 ? "up" : "down"} ${Math.abs(spy.changePct)}% from the previous close.\n\nProvide your BUY or SELL recommendation for the next trading day.`,
        },
      ],
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) throw new Error("No response from OpenAI");

    const parsed = JSON.parse(content);

    // Persist to database
    await sql`
      INSERT INTO ai_recommendations (eod_date, recommendation, reasoning, spy_close)
      VALUES (${spy.date}, ${parsed.recommendation}, ${parsed.reasoning}, ${spy.close})
      ON CONFLICT (eod_date) DO NOTHING
    `;

    return Response.json({
      status: "created",
      recommendation: parsed.recommendation,
      date: spy.date,
    });
  } catch (error) {
    console.error("AI recommendation error:", error);
    return Response.json({ error: "Failed to generate recommendation" }, { status: 500 });
  }
}
