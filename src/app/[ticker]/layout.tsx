import type { Metadata } from "next";
import { TICKERS, TICKER_SLUGS } from "@/lib/tickers";

export function generateStaticParams() {
  return TICKER_SLUGS.map((ticker) => ({ ticker }));
}

export async function generateMetadata({ params }: { params: Promise<{ ticker: string }> }): Promise<Metadata> {
  const { ticker } = await params;
  const symbol = ticker.toUpperCase();
  const info = TICKERS[symbol];

  if (!info) {
    return { title: "Unknown Ticker" };
  }

  const title = `Should I Invest in ${symbol}? | BUY or SELL Today`;
  const desc = `Should you invest in ${symbol} today? See the crowd's prediction and lock in your own forecast for ${info.description}.`;

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      url: `https://www.shouldiiinvestin.com/${symbol}`,
    },
    twitter: {
      title,
      description: desc,
    },
  };
}

export default async function TickerLayout({ children, params }: { children: React.ReactNode; params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const symbol = ticker.toUpperCase();
  const info = TICKERS[symbol];

  if (!info) return children;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `Should I Invest In ${symbol}?`,
    url: `https://www.shouldiiinvestin.com/${symbol}`,
    description: `Daily BUY/SELL predictions for ${symbol} (${info.description}) powered by crowd forecasting.`,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    about: {
      "@type": "FinancialProduct",
      name: symbol,
      description: info.description,
      url: `https://www.shouldiiinvestin.com/${symbol}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
