import sql from "@/lib/db";

export async function GET() {
  try {
    // predictions table
    await sql`
      CREATE TABLE IF NOT EXISTS predictions (
        id SERIAL PRIMARY KEY,
        ip_hash VARCHAR(16) NOT NULL,
        direction VARCHAR(4) NOT NULL CHECK (direction IN ('up', 'down')),
        ticker VARCHAR(10) NOT NULL DEFAULT 'SPY',
        prediction_date DATE NOT NULL,
        entry_price DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(ip_hash, ticker, prediction_date)
      )
    `;
    // Add ticker column if missing (migration for old tables)
    await sql`ALTER TABLE predictions ADD COLUMN IF NOT EXISTS ticker VARCHAR(10) NOT NULL DEFAULT 'SPY'`;
    await sql`CREATE INDEX IF NOT EXISTS idx_predictions_date ON predictions (prediction_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_predictions_ticker_date ON predictions (ticker, prediction_date)`;

    // ai_recommendations table
    await sql`
      CREATE TABLE IF NOT EXISTS ai_recommendations (
        id SERIAL PRIMARY KEY,
        ticker VARCHAR(10) NOT NULL DEFAULT 'SPY',
        eod_date DATE NOT NULL,
        recommendation VARCHAR(4) NOT NULL CHECK (recommendation IN ('BUY', 'SELL')),
        reasoning TEXT NOT NULL,
        close_price DECIMAL(10, 2) NOT NULL,
        generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(ticker, eod_date)
      )
    `;
    // Add ticker column if missing (migration for old tables)
    await sql`ALTER TABLE ai_recommendations ADD COLUMN IF NOT EXISTS ticker VARCHAR(10) NOT NULL DEFAULT 'SPY'`;
    await sql`ALTER TABLE ai_recommendations ADD COLUMN IF NOT EXISTS close_price DECIMAL(10, 2) NOT NULL DEFAULT 0`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_rec_ticker_date ON ai_recommendations (ticker, eod_date)`;

    return Response.json({ success: true, message: "Database initialized" });
  } catch (error) {
    console.error("Setup error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: "Setup failed", detail: message }, { status: 500 });
  }
}
