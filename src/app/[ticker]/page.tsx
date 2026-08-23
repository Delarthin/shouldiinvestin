"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { TICKERS } from "@/lib/tickers";
import styles from "./ticker.module.css";

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
  do {
    d.setDate(d.getDate() + 1);
  } while (d.getDay() === 0 || d.getDay() === 6);
  return d.toISOString().split("T")[0];
}

const ALL_MODELS = [
  { label: "gpt-4o-mini", display: "GPT-4o Mini" },
  { label: "claude-3-haiku", display: "Claude Haiku" },
  { label: "gemini-3.5-flash", display: "Gemini Flash" },
];

function ModelLogo({ model }: { model: string }) {
  if (model.includes("gpt")) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0">
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.998 5.998 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" fill="#10a37f"/>
      </svg>
    );
  }
  if (model.includes("claude")) {
    return (
      <img src="/claude-icon.png" alt="Claude" width={24} height={24} className="shrink-0" />
    );
  }
  if (model.includes("gemini")) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0">
        <path d="M12 24C12 20.2 11.1 17.5 9.3 15.7C7.5 13.9 4.8 13 1 13C4.8 13 7.5 12.1 9.3 10.3C11.1 8.5 12 5.8 12 2C12 5.8 12.9 8.5 14.7 10.3C16.5 12.1 19.2 13 23 13C19.2 13 16.5 13.9 14.7 15.7C12.9 17.5 12 20.2 12 24Z" fill="#4285f4"/>
      </svg>
    );
  }
  return null;
}

function AiPanel({ aiModels }: { aiModels: { model: string; recommendation: string; reasoning: string }[] }) {
  const modelMap = new Map(aiModels.map((m) => [m.model, m]));

  return (
    <div className="w-full border border-border border-t-0 bg-background">
      {ALL_MODELS.map((m) => {
        const data = modelMap.get(m.label);
        return (
          <div key={m.label} className="flex items-center justify-between px-5 py-4 border-b border-foreground/10 last:border-b-0">
            <div className="flex items-center gap-3">
              <ModelLogo model={m.label} />
              <span className="font-mono text-sm font-medium text-foreground">{m.display}</span>
            </div>
            {data ? (
              <span className={`font-mono text-base font-black ${data.recommendation === "BUY" ? "text-green-600" : "text-red-500"}`}>
                {data.recommendation}
              </span>
            ) : (
              <span className="font-mono text-base font-black text-muted">—</span>
            )}
          </div>
        );
      })}
      <div className="px-5 py-2 border-t border-foreground/10">
        <span className="font-mono text-[10px] text-muted">AI-generated. Not financial advice.</span>
      </div>
    </div>
  );
}

function HeroSection({ tickerData, eodDate, symbol, description }: { tickerData: TickerData; eodDate: string; symbol: string; description: string }) {
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [locked, setLocked] = useState(false);
  const [up, setUp] = useState(0);
  const [down, setDown] = useState(0);
  const [aiCall, setAiCall] = useState<"BUY" | "SELL" | null>(null);
  const [aiModels, setAiModels] = useState<{ model: string; recommendation: string; reasoning: string }[]>([]);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const predictionDate = nextTradingDay(eodDate);
  const total = up + down;
  const upPct = total > 0 ? Math.round((up / total) * 100) : 50;
  const storageKey = `siii-prediction-${symbol}`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.date === predictionDate) {
          setVote(parsed.direction);
          setLocked(true);
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch { /* ignore */ }
    }

    fetch(`/api/vote?date=${eodDate}&ticker=${symbol}`)
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

    // Fetch AI recommendations
    fetch(`/api/ai-recommendation?date=${eodDate}&ticker=${symbol}`)
      .then((r) => {
        if (!r.ok) throw new Error(`API returned ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (data.models && data.models.length > 0) {
          setAiModels(data.models);
          const gpt = data.models.find((m: { model: string }) => m.model.includes("gpt"));
          setAiCall((gpt || data.models[0])?.recommendation || null);
        } else if (data.recommendation) {
          setAiCall(data.recommendation);
          setAiModels([{ model: "gpt-4o-mini", recommendation: data.recommendation, reasoning: data.reasoning || "" }]);
        }
      })
      .catch((err) => { console.error("AI rec fetch error:", err); });
  }, [eodDate, predictionDate, symbol, storageKey]);

  function handleLockIn() {
    if (!vote) return;

    localStorage.setItem(storageKey, JSON.stringify({
      direction: vote,
      date: predictionDate,
      entryPrice: tickerData.close,
      lockedAt: new Date().toISOString(),
    }));
    setLocked(true);

    fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction: vote, eodDate, entryPrice: tickerData.close, ticker: symbol }),
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
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-start">
          {/* Left column */}
          <div className="flex flex-col justify-center">
            <h1 className="text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              SHOULD I
              <br />
              INVEST IN
              <br />
              <span className="text-accent">{symbol}</span>
              <span className="text-accent">?</span>
            </h1>

            <p className="mt-2 text-sm text-muted">{description}</p>

            <div className="mt-4 flex items-center gap-3">
              <span className="font-mono text-2xl font-black tabular-nums">${tickerData.close.toFixed(2)}</span>
              <span className={`font-mono text-sm font-medium tabular-nums ${tickerData.changePct >= 0 ? "text-green-600" : "text-red-500"}`}>
                {tickerData.changePct >= 0 ? "+" : ""}{tickerData.change.toFixed(2)} ({tickerData.changePct >= 0 ? "+" : ""}{tickerData.changePct.toFixed(2)}%)
              </span>
            </div>

            {/* EOD notice */}
            <div className="mt-2 inline-flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted/50" />
              <span className="font-mono text-xs text-muted">
                EOD data as of {formatDate(eodDate)}
              </span>
            </div>

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
                    <span className={`text-6xl font-black tracking-tight leading-none ${(aiCall || (upPct >= 50 ? "BUY" : "SELL")) === "BUY" ? "text-green-500" : "text-red-400"}`}>
                      {aiCall || (upPct >= 50 ? "BUY" : "SELL")}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-sm tracking-wide text-background/50">{symbol} &middot; {description}</span>
                  </div>
                </div>
                <div className="border-t border-background/10 px-8 py-3">
                  <span className="font-mono text-[10px] text-background/30">Not financial advice.</span>
                </div>
              </div>

              {/* What AI Thinks — mobile */}
              <button
                onClick={() => setShowAiPanel(!showAiPanel)}
                className="w-full py-3 bg-foreground/90 text-background font-mono text-xs font-bold tracking-wider hover:bg-foreground/80 transition-colors flex items-center justify-center gap-2 border border-border border-t-0"
              >
                WHAT AI THINKS
                <svg
                  width="10" height="10" viewBox="0 0 10 10" fill="none"
                  className={`transition-transform ${showAiPanel ? "rotate-180" : ""}`}
                >
                  <path d="M2 4L5 7L8 4" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>

              {showAiPanel && aiModels.length > 0 && (
                <div className="mt-3 w-full border-2 border-foreground/20 bg-background">
                  {aiModels.map((m) => (
                    <div key={m.model} className="flex items-center justify-between px-5 py-4 border-b border-foreground/10 last:border-b-0">
                      <span className="font-mono text-sm font-medium text-foreground">{m.model}</span>
                      <span className={`font-mono text-base font-black ${m.recommendation === "BUY" ? "text-green-600" : "text-red-500"}`}>
                        {m.recommendation}
                      </span>
                    </div>
                  ))}
                  <div className="px-5 py-2 border-t border-foreground/10">
                    <span className="font-mono text-[10px] text-muted">AI-generated. Not financial advice.</span>
                  </div>
                </div>
              )}

              {showAiPanel && aiModels.length === 0 && (
                <div className="mt-3 w-full border border-border bg-background px-4 py-4 text-center">
                  <span className="font-mono text-xs text-muted">No AI recommendations available yet.</span>
                </div>
              )}
            </div>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted">
              Predictions are scored against end-of-day closing prices.
              Market closes at 4:00 PM ET, Monday through Friday. Data updates daily after close.
            </p>

            {/* UP / DOWN prediction */}
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
                    LOCKED: {symbol} {vote === "up" ? "GOES UP" : "GOES DOWN"}
                  </div>
                  <div className="font-mono text-xs mt-1 opacity-75">
                    Entry: ${tickerData.close.toFixed(2)} &middot; Resolves {formatDate(predictionDate)}
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
                      {symbol} GOES UP
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
                      {symbol} GOES DOWN
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
                    {vote ? `Lock In: ${symbol} ${vote === "up" ? "GOES UP" : "GOES DOWN"}` : "Select UP or DOWN"}
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
          <div className="relative hidden lg:flex flex-col items-center justify-start">
            <div className="w-full border border-border bg-gradient-to-br from-foreground to-foreground/90 text-background flex flex-col">
              <div className="p-10 flex-1">
              <div className="mb-6">
                <span className="font-mono text-xs tracking-widest text-background/50">CALL OF THE DAY</span>
              </div>

              <div className="mb-8">
                <span className="font-mono text-xs tracking-wider text-accent">FOR</span>
                <div className="text-3xl font-black tracking-tight">{formatDate(predictionDate)}</div>
              </div>

              <div className="mb-6">
                <span className={`text-8xl font-black tracking-tight leading-none ${(aiCall || (upPct >= 50 ? "BUY" : "SELL")) === "BUY" ? "text-green-500" : "text-red-400"}`}>
                  {aiCall || (upPct >= 50 ? "BUY" : "SELL")}
                </span>
              </div>

              <div>
                <span className="font-mono text-sm tracking-wide text-background/50">{symbol} &middot; {description}</span>
              </div>

              </div>
              <div className="border-t border-background/10 px-10 py-3">
                <span className="font-mono text-[10px] text-background/30">Not financial advice.</span>
              </div>
            </div>

            {/* What AI Thinks — below the card */}
            <button
              onClick={() => setShowAiPanel(!showAiPanel)}
              className="w-full py-3 bg-foreground/90 text-background font-mono text-xs font-bold tracking-wider hover:bg-foreground/80 transition-colors flex items-center justify-center gap-2 border border-border border-t-0"
            >
              WHAT AI THINKS
              <svg
                width="10" height="10" viewBox="0 0 10 10" fill="none"
                className={`transition-transform ${showAiPanel ? "rotate-180" : ""}`}
              >
                <path d="M2 4L5 7L8 4" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>

            {showAiPanel && <AiPanel aiModels={aiModels} />}
          </div>
        </div>
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

export default function TickerPage() {
  const params = useParams();
  const symbol = (params.ticker as string).toUpperCase();
  const tickerInfo = TICKERS[symbol];
  const [eod, setEod] = useState<EODData | null>(null);

  useEffect(() => {
    fetch("/api/eod")
      .then((r) => r.json())
      .then((data: EODData) => setEod(data))
      .catch(() => {
        fetch("/data/eod.json")
          .then((r) => r.json())
          .then((data: EODData) => setEod(data))
          .catch(() => {});
      });
  }, []);

  if (!tickerInfo) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="font-mono text-sm text-red-500">Unknown ticker: {symbol}</span>
      </div>
    );
  }

  if (!eod) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="font-mono text-sm text-muted">Loading EOD data...</span>
      </div>
    );
  }

  const tickerData = eod.tickers.find((t) => t.ticker === symbol);
  if (!tickerData) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="font-mono text-sm text-red-500">{symbol} data not available</span>
      </div>
    );
  }

  return (
    <>
      <TickerTape tickers={eod.tickers} />
      <HeroSection tickerData={tickerData} eodDate={tickerData.date} symbol={symbol} description={tickerInfo.description} />
      <Footer eodDate={tickerData.date} />
    </>
  );
}
