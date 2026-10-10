import { NextRequest, NextResponse } from "next/server";
import { privateData } from "@/server/privacy";
import { authorize } from "@/server/auth/access";
import { parseLogs } from "@/server/parsers";
import { readText, ApiError, errorResponse } from "@/server/http";
import { distributedRateLimit, clientIp } from "@/server/rate-limit";
import { detect } from "@/server/detection";
import { correlate } from "@/server/correlation";
export const runtime = "nodejs";
export const maxDuration = 30;
export async function POST(req: NextRequest) {
  try {
    const session = await authorize(req, "write");
    if (!(await distributedRateLimit(`detect:${clientIp(req)}`, 20, 60000)))
      throw new ApiError(429, "rate_limited");
    const events = parseLogs(await readText(req), "detect");
    const alerts = detect(events);
    return NextResponse.json(
      await privateData(
        {
          events: events.length,
          alerts,
          cases: correlate(alerts),
          simulation: false,
        },
        session,
      ),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
