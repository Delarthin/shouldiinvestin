import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Should I Invest in SPY? | BUY or SELL Today",
  description:
    "Should you invest in SPY today? See the crowd's prediction, GPT's daily BUY/SELL call, and lock in your own forecast for the S&P 500 ETF.",
  openGraph: {
    title: "Should I Invest in SPY? | BUY or SELL Today",
    description:
      "See the crowd's prediction and GPT's daily BUY/SELL call for SPY (S&P 500 ETF). Lock in your forecast now.",
    url: "https://shouldiinvestin.vercel.app/SPY",
  },
  twitter: {
    title: "Should I Invest in SPY? | BUY or SELL Today",
    description:
      "See the crowd's prediction and GPT's daily BUY/SELL call for SPY. Lock in your forecast now.",
  },
};

export default function SPYLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Should I Invest In SPY?",
    url: "https://shouldiinvestin.vercel.app/SPY",
    description:
      "Daily BUY/SELL predictions for SPY (S&P 500 ETF) powered by crowd forecasting and GPT.",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    about: {
      "@type": "FinancialProduct",
      name: "SPY",
      description: "SPDR S&P 500 ETF Trust",
      url: "https://shouldiinvestin.vercel.app/SPY",
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
