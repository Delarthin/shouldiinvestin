"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./spy.module.css";

/* ───────────────────── Types ───────────────────── */

interface TickerData {
  ticker: string;
  close: number;
  prevClose: number;
  change: number;
  changePct: number;
  date: string;
}

interface EODData {
  fetchedAt: string;
  dataType: string;
  tickers: TickerData[];
}

/* ───────────────────── Helpers ───────────────────── */

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className={`${styles.pulseDot} absolute inline-flex h-full w-full rounded-full bg-accent opacity-75`} />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
    </span>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ───────────────────── Ticker Tape ───────────────────── */

function TickerTape({ tickers }: { tickers: TickerData[] }) {
  const [tickerWidth, setTickerWidth] = useState(0);
  const firstHalfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (firstHalfRef.current) {
      const w = firstHalfRef.current.offsetWidth;
      setTickerWidth(w);

      // Inject keyframes with exact pixel width for seamless loop
      const styleId = "ticker-loop-style";
      let style = document.getElementById(styleId) as HTMLStyleElement | null;
      if (!style) {
        style = document.createElement("style");
        style.id = styleId;
        document.head.appendChild(style);
      }
      style.textContent = `
        @keyframes ticker-loop {
          0% { transform: translateX(0); }
          100% { transform: translateX(-${w}px); }
        }
      `;
    }
  }, [tickers]);

  const tickerItems = tickers.map((item, i) => (
    <span key={i} className="mx-6 font-mono text-xs inline-flex items-center gap-2 shrink-0">
      <span className="font-medium">{item.ticker}</span>
      <span className={item.changePct >= 0 ? "text-green-600" : "text-red-500"}>
        {item.changePct >= 0 ? "+" : ""}{item.changePct.toFixed(2)}%
      </span>
    </span>
  ));

  return (
    <div className="border-b border-border bg-background overflow-hidden">
      <div
        className="flex whitespace-nowrap py-2"
        style={tickerWidth ? {
          animation: `ticker-loop ${tickerWidth / 50}s linear infinite`,
        } : undefined}
      >
        <div ref={firstHalfRef} className="flex shrink-0">
          {tickerItems}
        </div>
        <div className="flex shrink-0">
          {tickerItems}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────── Hero Section ───────────────────── */

function nextTradingDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  // Advance to next weekday
  do {
    d.setDate(d.getDate() + 1);
  } while (d.getDay() === 0 || d.getDay() === 6);
  return d.toISOString().split("T")[0];
}

function HeroSection({ spy, eodDate }: { spy: TickerData; eodDate: string }) {
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [locked, setLocked] = useState(false);
  const [up, setUp] = useState(0);
  const [down, setDown] = useState(0);
  const predictionDate = nextTradingDay(eodDate);
  const total = up + down;
  const upPct = total > 0 ? Math.round((up / total) * 100) : 50;

  // Fetch existing votes and check if user already voted
  useEffect(() => {
    // Check localStorage first
    const saved = localStorage.getItem("siii-prediction");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.date === predictionDate) {
          setVote(parsed.direction);
          setLocked(true);
        } else {
          localStorage.removeItem("siii-prediction");
        }
      } catch { /* ignore */ }
    }

    // Try API for real tallies (works when DB is connected)
    fetch(`/api/vote?date=${eodDate}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => {
        setUp(data.up || 0);
        setDown(data.down || 0);
        if (data.userVote) {
          setVote(data.userVote);
          setLocked(true);
        }
      })
      .catch(() => {});
  }, [eodDate, predictionDate]);

  function handleLockIn() {
    if (!vote) return;

    // Always save to localStorage
    localStorage.setItem("siii-prediction", JSON.stringify({
      direction: vote,
      date: predictionDate,
      entryPrice: spy.close,
      lockedAt: new Date().toISOString(),
    }));
    setLocked(true);

    // Try API (works when DB is connected)
    fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction: vote, eodDate, entryPrice: spy.close }),
    })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => {
        setUp(data.up || 0);
        setDown(data.down || 0);
      })
      .catch(() => {});
  }

  return (
    <section className={`${styles.gridBg} relative overflow-hidden`}>
      <div className="mx-auto max-w-7xl px-6 pb-20 pt-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left column */}
          <div className="flex flex-col justify-center">
            <h1 className="text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              SHOULD I
              <br />
              INVEST IN
              <br />
              <span className="text-accent">SPY</span>
              <span className="text-accent">?</span>
            </h1>

            <p className="mt-2 text-sm text-muted">SPDR S&amp;P 500 ETF Trust</p>

            <div className="mt-4 flex items-center gap-3">
              <span className="font-mono text-2xl font-black tabular-nums">${spy.close.toFixed(2)}</span>
              <span className={`font-mono text-sm font-medium tabular-nums ${spy.changePct >= 0 ? "text-green-600" : "text-red-500"}`}>
                {spy.changePct >= 0 ? "+" : ""}{spy.change.toFixed(2)} ({spy.changePct >= 0 ? "+" : ""}{spy.changePct.toFixed(2)}%)
              </span>
            </div>

            {/* EOD notice */}
            <div className="mt-2 inline-flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted/50" />
              <span className="font-mono text-xs text-muted">
                EOD data as of {formatDate(eodDate)}
              </span>
            </div>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted lg:block hidden">
              Predictions are scored against end-of-day closing prices.
              Market closes at 4:00 PM ET, Monday through Friday. Data updates daily after close.
            </p>

            {/* Call of the Day card - mobile only */}
            <div className="mt-8 lg:hidden">
              <div className="w-full border border-border bg-gradient-to-br from-foreground to-foreground/90 text-background flex flex-col">
                <div className="p-8 flex-1">
                  <div className="mb-4">
                    <span className="font-mono text-xs tracking-widest text-background/50">CALL OF THE DAY</span>
                  </div>
                  <div className="mb-6">
                    <span className="font-mono text-xs tracking-wider text-accent">FOR</span>
                    <div className="text-2xl font-black tracking-tight">{formatDate(predictionDate)}</div>
                  </div>
                  <div className="mb-4">
                    <span className={`text-6xl font-black tracking-tight leading-none ${upPct >= 50 ? "text-green-500" : "text-red-400"}`}>
                      {upPct >= 50 ? "BUY" : "SELL"}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-sm tracking-wide text-background/50">SPY &middot; SPDR S&amp;P 500</span>
                  </div>
                </div>
                <div className="border-t border-background/10 px-8 py-3">
                  <span className="font-mono text-[10px] text-background/30">Not financial advice.</span>
                </div>
              </div>
            </div>

            {/* Simplified UP / DOWN prediction */}
            <div id="prediction" className="mt-10 max-w-md">
              <div className="mb-3 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs tracking-wider text-muted">
                    MAKE YOUR CALL
                  </span>
                  <span className="font-mono text-xs text-muted">
                    {upPct}% say UP
                  </span>
                </div>
                <span className="font-mono text-xs text-muted">
                  Predicting close on {formatDate(predictionDate)}
                </span>
              </div>

              {locked ? (
                <div className={`py-4 border text-center ${vote === "up" ? "bg-green-600 text-white border-green-600" : "bg-red-500 text-white border-red-500"}`}>
                  <div className="font-mono text-sm font-bold">
                    LOCKED: SPY {vote === "up" ? "GOES UP" : "GOES DOWN"}
                  </div>
                  <div className="font-mono text-xs mt-1 opacity-75">
                    Entry: ${spy.close.toFixed(2)} &middot; Resolves {formatDate(predictionDate)}
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setVote("up")}
                      className={`py-4 font-mono text-sm font-bold border transition-all flex items-center justify-center gap-2 ${
                        vote === "up"
                          ? "bg-green-600 text-white border-green-600"
                          : "border-border hover:border-green-600 hover:bg-green-600/5"
                      }`}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 13V3M8 3L3 8M8 3L13 8" stroke="currentColor" strokeWidth="2" />
                      </svg>
                      SPY GOES UP
                    </button>
                    <button
                      onClick={() => setVote("down")}
                      className={`py-4 font-mono text-sm font-bold border transition-all flex items-center justify-center gap-2 ${
                        vote === "down"
                          ? "bg-red-500 text-white border-red-500"
                          : "border-border hover:border-red-500 hover:bg-red-500/5"
                      }`}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 3V13M8 13L3 8M8 13L13 8" stroke="currentColor" strokeWidth="2" />
                      </svg>
                      SPY GOES DOWN
                    </button>
                  </div>

                  <button
                    onClick={handleLockIn}
                    className={`mt-3 w-full py-3 font-mono text-sm font-medium transition-all inline-flex items-center justify-center gap-2 ${
                      vote
                        ? "bg-accent text-white hover:bg-accent/90 cursor-pointer"
                        : "bg-border/50 text-muted cursor-not-allowed"
                    }`}
                    disabled={!vote}
                  >
                    {vote ? `Lock In: SPY ${vote === "up" ? "GOES UP" : "GOES DOWN"}` : "Select UP or DOWN"}
                    {vote && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M1 13L13 1M13 1H5M13 1V9" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    )}
                  </button>
                </>
              )}

            </div>
          </div>

          {/* Right column - Call of the Day card (desktop only) */}
          <div className="relative hidden lg:flex items-center justify-center">
            <div className="w-full border border-border bg-gradient-to-br from-foreground to-foreground/90 text-background flex flex-col">
              <div className="p-10 flex-1">
              {/* Header */}
              <div className="mb-6">
                <span className="font-mono text-xs tracking-widest text-background/50">CALL OF THE DAY</span>
              </div>

              {/* Date */}
              <div className="mb-8">
                <span className="font-mono text-xs tracking-wider text-accent">FOR</span>
                <div className="text-3xl font-black tracking-tight">{formatDate(predictionDate)}</div>
              </div>

              {/* Giant verdict */}
              <div className="mb-6">
                <span className={`text-8xl font-black tracking-tight leading-none ${upPct >= 50 ? "text-green-500" : "text-red-400"}`}>
                  {upPct >= 50 ? "BUY" : "SELL"}
                </span>
              </div>

              {/* Ticker */}
              <div>
                <span className="font-mono text-sm tracking-wide text-background/50">SPY &middot; SPDR S&amp;P 500</span>
              </div>

              </div>
              {/* Disclaimer pinned to bottom */}
              <div className="border-t border-background/10 px-10 py-3">
                <span className="font-mono text-[10px] text-background/30">Not financial advice.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── Stats Bar ───────────────────── */

function StatsBar() {
  return (
    <section className="border-y border-border bg-background">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border md:grid-cols-4">
        {[
          { label: "Predictions", value: "12,482" },
          { label: "Say UP", value: "64%" },
          { label: "Say DOWN", value: "36%" },
          { label: "Predictors", value: "4,218" },
        ].map((s) => (
          <div key={s.label} className="px-6 py-6 text-center">
            <div className="font-mono text-2xl font-bold">{s.value}</div>
            <div className="mt-1 font-mono text-xs text-muted tracking-wide">{s.label.toUpperCase()}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────── Footer ───────────────────── */

function Footer({ eodDate }: { eodDate: string }) {
  return (
    <footer className="border-t border-border bg-background py-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <a href="/" className="flex items-center gap-2">
            <LiveDot />
            <span className="font-mono text-xs font-bold tracking-tight">SHOULDIINVESTIN</span>
          </a>
          <p className="font-mono text-xs text-muted">
            EOD data via Yahoo Finance &middot; Data as of {formatDate(eodDate)}
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ───────────────────── Page ───────────────────── */

export default function SPYPage() {
  const [eod, setEod] = useState<EODData | null>(null);

  useEffect(() => {
    fetch("/api/eod")
      .then((r) => r.json())
      .then((data: EODData) => setEod(data))
      .catch(() => {
        // Fallback to static file if API fails (local dev)
        fetch("/data/eod.json")
          .then((r) => r.json())
          .then((data: EODData) => setEod(data))
          .catch(() => {});
      });
  }, []);

  if (!eod) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="font-mono text-sm text-muted">Loading EOD data...</span>
      </div>
    );
  }

  const spy = eod.tickers.find((t) => t.ticker === "SPY");
  if (!spy) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="font-mono text-sm text-red-500">SPY data not available</span>
      </div>
    );
  }

  return (
    <>
      <TickerTape tickers={eod.tickers} />
      <HeroSection spy={spy} eodDate={spy.date} />
      <Footer eodDate={spy.date} />
    </>
  );
}
