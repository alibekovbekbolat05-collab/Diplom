import { z } from "zod";
import { NextResponse } from "next/server";
import { ApiError, errorResponse, readJson, sameOrigin } from "@/server/http";
import { distributedRateLimit, clientIp } from "@/server/rate-limit";
export const runtime = "nodejs";
export const maxDuration = 15;
const schema = z
  .object({
    name: z.string().trim().min(1).max(100),
    email: z.string().email().max(254),
    message: z.string().trim().min(10).max(3000),
    website: z.string().max(200).default(""),
  })
  .strict();
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    if (
      !(await distributedRateLimit(`contact:${clientIp(request)}`, 5, 3600000))
    )
      throw new ApiError(429, "rate_limited");
    const parsed = schema.safeParse(await readJson(request, 10000));
    if (!parsed.success) throw new ApiError(400, "invalid_contact");
    if (parsed.data.website) return NextResponse.json({ ok: true });
    const token = process.env.TELEGRAM_BOT_TOKEN,
      chat = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chat) throw new ApiError(503, "contact_not_configured");
    const d = parsed.data;
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chat,
          text: `Contact: ${d.name}\n${d.email}\n\n${d.message}`,
        }),
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!response.ok) throw new ApiError(502, "delivery_failed");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
