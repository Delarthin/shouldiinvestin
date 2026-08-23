import { NextRequest } from "next/server";

const TICKERS = [
  "SPY", "VOO", "QQQ", "IVV", "VTI", "DIA", "IWM",
  "NVDA", "AAPL", "MSFT", "META", "AMZN", "TSLA", "AMD", "PLTR", "GOOG",
];

interface ChartResponse {
  chart?: {
    result?: Array<{
      meta: {
        symbol: string;
        regularMarketPrice: number;
        regularMarketTime: number;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: (number | null)[];
        }>;
      };
    }>;
  };
}

async function fetchTicker(ticker: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 0 },
  });

  if (!res.ok) return null;

  const data: ChartResponse = await res.json();
  const result = data.chart?.result?.[0];
  if (!result) return null;

  const closes = result.indicators?.quote?.[0]?.close;
  const timestamps = result.timestamp;
  if (!closes || !timestamps || closes.length < 2) return null;

  // Use actual daily closes from the chart data, not chartPreviousClose
  const validCloses: { close: number; ts: number }[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (closes[i] != null) {
      validCloses.push({ close: closes[i] as number, ts: timestamps[i] });
    }
  }

  if (validCloses.length < 2) return null;

  const latest = validCloses[validCloses.length - 1];
  const previous = validCloses[validCloses.length - 2];
  const change = latest.close - previous.close;
  const changePct = (change / previous.close) * 100;
  const date = new Date(latest.ts * 1000).toISOString().split("T")[0];

  return {
    ticker: result.meta.symbol,
    close: Math.round(latest.close * 100) / 100,
    prevClose: Math.round(previous.close * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePct: Math.round(changePct * 100) / 100,
    date,
  };
}

export async function GET(request: NextRequest) {
  try {
    const results = await Promise.all(TICKERS.map(fetchTicker));
    const tickers = results.filter(Boolean);

    const payload = {
      fetchedAt: new Date().toISOString(),
      dataType: "EOD",
      tickers,
    };

    return Response.json(payload, {
      headers: {
        "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("EOD fetch error:", error);
    return Response.json(
      { error: "Failed to fetch EOD data", fetchedAt: new Date().toISOString() },
      { status: 500 }
    );
  }
}
