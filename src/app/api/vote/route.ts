import { sql } from "@vercel/postgres";
import { NextRequest } from "next/server";
import { createHash } from "crypto";

function hashIP(ip: string): string {
  return createHash("sha256").update(ip + (process.env.IP_SALT || "siii")).digest("hex").slice(0, 16);
}

function nextTradingDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  do {
    d.setDate(d.getDate() + 1);
  } while (d.getDay() === 0 || d.getDay() === 6);
  return d.toISOString().split("T")[0];
}

// GET — fetch current vote tallies + whether this IP already voted
export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = hashIP(ip);
  const dateParam = request.nextUrl.searchParams.get("date");

  if (!dateParam) {
    return Response.json({ error: "date param required" }, { status: 400 });
  }

  const predictionDate = nextTradingDay(dateParam);

  const [tallies, userVote] = await Promise.all([
    sql`SELECT direction, COUNT(*)::int as count FROM predictions WHERE prediction_date = ${predictionDate} GROUP BY direction`,
    sql`SELECT direction FROM predictions WHERE prediction_date = ${predictionDate} AND ip_hash = ${ipHash} LIMIT 1`,
  ]);

  let up = 0;
  let down = 0;
  for (const row of tallies.rows) {
    if (row.direction === "up") up = row.count;
    if (row.direction === "down") down = row.count;
  }

  return Response.json({
    predictionDate,
    up,
    down,
    total: up + down,
    userVote: userVote.rows[0]?.direction || null,
  });
}

// POST — submit a vote
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = hashIP(ip);

  const body = await request.json();
  const { direction, eodDate, entryPrice } = body;

  if (!direction || !eodDate) {
    return Response.json({ error: "direction and eodDate required" }, { status: 400 });
  }

  if (direction !== "up" && direction !== "down") {
    return Response.json({ error: "direction must be 'up' or 'down'" }, { status: 400 });
  }

  const predictionDate = nextTradingDay(eodDate);

  // Check if already voted for this date
  const existing = await sql`SELECT id FROM predictions WHERE prediction_date = ${predictionDate} AND ip_hash = ${ipHash} LIMIT 1`;

  if (existing.rows.length > 0) {
    return Response.json({ error: "Already voted for this date" }, { status: 409 });
  }

  await sql`INSERT INTO predictions (ip_hash, direction, prediction_date, entry_price, created_at) VALUES (${ipHash}, ${direction}, ${predictionDate}, ${entryPrice || 0}, NOW())`;

  // Return updated tallies
  const tallies = await sql`SELECT direction, COUNT(*)::int as count FROM predictions WHERE prediction_date = ${predictionDate} GROUP BY direction`;

  let up = 0;
  let down = 0;
  for (const row of tallies.rows) {
    if (row.direction === "up") up = row.count;
    if (row.direction === "down") down = row.count;
  }

  return Response.json({
    predictionDate,
    up,
    down,
    total: up + down,
    userVote: direction,
  });
}
