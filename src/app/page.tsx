"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { TICKERS, TICKER_SLUGS } from "@/lib/tickers";

function ShuffleTicker({ text }: { text: string }) {
  const [current, setCurrent] = useState(text);
  const [prev, setPrev] = useState(text);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (text !== current) {
      setPrev(current);
      setCurrent(text);
      setAnimating(true);
      setTimeout(() => {
        setAnimating(false);
      }, 500);
    }
  }, [text, current]);

  return (
    <span className="inline-flex overflow-hidden relative justify-end" style={{ height: "1.15em", width: "100%" }}>
      {/* Old ticker sliding up and out */}
      {animating && (
        <span
          className="absolute right-0 animate-[slideOut_500ms_ease-in-out_forwards]"
        >
          {prev}
        </span>
      )}
      {/* New ticker sliding up from below */}
      <span
        className={animating ? "animate-[slideIn_500ms_ease-in-out_forwards]" : ""}
      >
        {current}
      </span>
      <style>{`
        @keyframes slideOut {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(-100%); opacity: 0; }
        }
        @keyframes slideIn {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </span>
  );
}

function TickerMarquee() {
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const firstHalfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (firstHalfRef.current) {
      const w = firstHalfRef.current.offsetWidth;
      setContentWidth(w);

      const styleId = "marquee-ticker-style";
      let style = document.getElementById(styleId) as HTMLStyleElement | null;
      if (!style) {
        style = document.createElement("style");
        style.id = styleId;
        document.head.appendChild(style);
      }
      style.textContent = `
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-${w}px); }
        }
      `;
    }
  }, []);

  const items = TICKER_SLUGS.map((ticker) => (
    <a
      key={ticker}
      href={`/${ticker}`}
      className="mx-3 font-mono text-xs text-muted hover:text-accent transition-colors shrink-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {ticker}
    </a>
  ));

  return (
    <div
      ref={containerRef}
      className="mt-3 w-full overflow-hidden"
    >
      <div
        className="flex whitespace-nowrap"
        style={contentWidth ? {
          animation: `marquee-scroll ${contentWidth / 30}s linear infinite`,
          animationPlayState: paused ? "paused" : "running",
        } : undefined}
      >
        <div ref={firstHalfRef} className="flex shrink-0">{items}</div>
        <div className="flex shrink-0">{items}</div>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % TICKER_SLUGS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ticker = query.trim().toUpperCase();
    if (ticker && TICKERS[ticker]) {
      router.push(`/${ticker}`);
    }
  }

  const currentTicker = TICKER_SLUGS[currentIndex];
  const maxLen = Math.max(...TICKER_SLUGS.map((t) => t.length));

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6">
      <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black leading-[0.95] tracking-tight text-center">
        SHOULD I
        <br />
        INVEST IN
        <br />
        <span className="text-accent font-mono inline-flex justify-end" style={{ width: `${maxLen * 0.65}em` }}>
          <ShuffleTicker text={currentTicker} />
        </span>
        <span className="text-accent">?</span>
      </h1>

      {/* Value props */}
      <div className="mt-6 flex items-center gap-4 font-mono text-xs text-muted">
        <span>Crowd sentiment</span>
        <span className="text-border">·</span>
        <span>AI agent predictions</span>
        <span className="text-border">·</span>
        <span>Market fundamentals</span>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 w-full max-w-md">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            placeholder="Search a ticker..."
            className="w-full border border-border bg-background px-4 py-3 font-mono text-sm tracking-wider text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
          />
          <button
            type="submit"
            className="absolute right-0 top-0 h-full px-4 font-mono text-xs tracking-wider text-muted hover:text-foreground transition-colors"
          >
            GO
          </button>
        </div>
        <TickerMarquee />
      </form>

      {/* Disclaimer */}
      <div className="mt-10 max-w-lg text-center">
        <p className="font-mono text-[10px] text-muted/60">
          All information reflected is based on crowd sentiment. This is not financial advice. Please exercise your own judgement before making investment decisions.
        </p>
      </div>
    </main>
  );
}
