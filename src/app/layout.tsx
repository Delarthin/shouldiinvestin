import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.shouldiiinvestin.com"),
  title: {
    default: "Should I Invest In? | Live Social Forecasting",
    template: "%s | Should I Invest In?",
  },
  description:
    "Stake your intuition against the grid. Make predictions, build your track record, and watch collective intelligence price the future in real time.",
  keywords: [
    "SPY", "S&P 500", "stock prediction", "market forecast",
    "invest", "buy or sell", "social forecasting", "ETF",
  ],
  openGraph: {
    type: "website",
    siteName: "Should I Invest In?",
    title: "Should I Invest In? | Live Social Forecasting",
    description:
      "Stake your intuition against the grid. Predict if SPY goes up or down and track your accuracy.",
    url: "https://www.shouldiiinvestin.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Should I Invest In? | Live Social Forecasting",
    description:
      "Predict if SPY goes up or down. Track your accuracy against the crowd.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Should I Invest In?",
    url: "https://www.shouldiiinvestin.com",
    description:
      "Live social forecasting platform. Predict if stocks go up or down and track your accuracy.",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://www.shouldiiinvestin.com/{ticker}",
      "query-input": "required name=ticker",
    },
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
