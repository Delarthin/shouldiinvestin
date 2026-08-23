import sql from "@/lib/db";
import { NextRequest } from "next/server";
import { createHash } from "crypto";

function hashIP(ip: string): string {
  return createHash("sha256").update(ip + (process.env.IP_SALT || "siii")).digest("hex").slice(0, 16);
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = hashIP(ip);

  const body = await request.json();
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!message || message.length > 500) {
    return Response.json({ error: "Message required (max 500 chars)" }, { status: 400 });
  }

  // Rate limit: 1 feedback per IP per hour
  const recent = await sql`
    SELECT id FROM feedback WHERE ip_hash = ${ipHash} AND created_at > NOW() - INTERVAL '1 hour' LIMIT 1
  `;
  if (recent.length > 0) {
    return Response.json({ error: "Please wait before submitting more feedback" }, { status: 429 });
  }

  await sql`INSERT INTO feedback (message, ip_hash) VALUES (${message}, ${ipHash})`;

  return Response.json({ success: true });
}
