import sql from "@/lib/db";

export async function GET() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS predictions (
        id SERIAL PRIMARY KEY,
        ip_hash VARCHAR(16) NOT NULL,
        direction VARCHAR(4) NOT NULL CHECK (direction IN ('up', 'down')),
        prediction_date DATE NOT NULL,
        entry_price DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(ip_hash, prediction_date)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_predictions_date ON predictions (prediction_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_predictions_ip_date ON predictions (ip_hash, prediction_date)`;

    await sql`
      CREATE TABLE IF NOT EXISTS ai_recommendations (
        id SERIAL PRIMARY KEY,
        eod_date DATE NOT NULL UNIQUE,
        recommendation VARCHAR(4) NOT NULL CHECK (recommendation IN ('BUY', 'SELL')),
        reasoning TEXT NOT NULL,
        spy_close DECIMAL(10, 2) NOT NULL,
        generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_rec_date ON ai_recommendations (eod_date)`;

    return Response.json({ success: true, message: "Database initialized" });
  } catch (error) {
    console.error("Setup error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: "Setup failed", detail: message }, { status: 500 });
  }
}
