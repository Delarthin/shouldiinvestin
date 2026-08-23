"""
Fetch EOD market data via yfinance and write to public/data/eod.json.

Run daily after market close (e.g. 5pm ET via cron):
  python3 scripts/fetch_eod.py

Outputs: public/data/eod.json
"""

import json
import os
from datetime import datetime, timezone

import yfinance as yf

TICKERS = [
    "SPY", "VOO", "QQQ", "IVV", "VTI", "DIA", "IWM",
    "NVDA", "AAPL", "MSFT", "META", "AMZN", "TSLA", "AMD", "PLTR", "GOOG",
]

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "data")


def fetch_eod():
    results = []

    data = yf.download(TICKERS, period="5d", group_by="ticker", progress=False)

    for ticker in TICKERS:
        try:
            if len(TICKERS) == 1:
                df = data
            else:
                df = data[ticker]

            df = df.dropna(subset=["Close"])
            if len(df) < 2:
                continue

            close_today = float(df["Close"].iloc[-1])
            close_prev = float(df["Close"].iloc[-2])
            change = close_today - close_prev
            change_pct = (change / close_prev) * 100
            date_str = str(df.index[-1].date())

            results.append({
                "ticker": ticker,
                "close": round(close_today, 2),
                "prevClose": round(close_prev, 2),
                "change": round(change, 2),
                "changePct": round(change_pct, 2),
                "date": date_str,
            })
        except Exception as e:
            print(f"Error fetching {ticker}: {e}")

    output = {
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "dataType": "EOD",
        "tickers": results,
    }

    os.makedirs(OUT_DIR, exist_ok=True)
    out_path = os.path.join(OUT_DIR, "eod.json")
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2)

    print(f"Wrote {len(results)} tickers to {out_path}")


if __name__ == "__main__":
    fetch_eod()
