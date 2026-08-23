export const TICKERS: Record<string, { name: string; description: string }> = {
  SPY: { name: "SPY", description: "SPDR S&P 500 ETF Trust" },
  QQQ: { name: "QQQ", description: "Invesco QQQ Trust (Nasdaq 100)" },
  TSLA: { name: "TSLA", description: "Tesla, Inc." },
  NVDA: { name: "NVDA", description: "NVIDIA Corporation" },
  AAPL: { name: "AAPL", description: "Apple Inc." },
  AMZN: { name: "AMZN", description: "Amazon.com, Inc." },
  MSFT: { name: "MSFT", description: "Microsoft Corporation" },
  META: { name: "META", description: "Meta Platforms, Inc." },
  GOOG: { name: "GOOG", description: "Alphabet Inc." },
  AMD: { name: "AMD", description: "Advanced Micro Devices, Inc." },
};

export const TICKER_SLUGS = Object.keys(TICKERS);
