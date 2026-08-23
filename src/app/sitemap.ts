import type { MetadataRoute } from "next";
import { TICKER_SLUGS } from "@/lib/tickers";

export default function sitemap(): MetadataRoute.Sitemap {
  const tickerPages = TICKER_SLUGS.map((ticker) => ({
    url: `https://www.shouldiiinvestin.com/${ticker}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  return [
    {
      url: "https://www.shouldiiinvestin.com",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...tickerPages,
  ];
}
