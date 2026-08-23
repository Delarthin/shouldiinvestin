import sql from "@/lib/db";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || !email.includes("@") || email.length > 254) {
    return Response.json({ error: "Valid email required" }, { status: 400 });
  }

  // Check if already subscribed
  const existing = await sql`SELECT id FROM subscribers WHERE email = ${email} LIMIT 1`;
  if (existing.length > 0) {
    return Response.json({ success: true, message: "Already subscribed" });
  }

  await sql`INSERT INTO subscribers (email) VALUES (${email}) ON CONFLICT DO NOTHING`;

  return Response.json({ success: true });
}
