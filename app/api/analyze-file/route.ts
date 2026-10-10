import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/server/auth/access";
import { ApiError, errorResponse, readText } from "@/server/http";
import { parseLogs } from "@/server/parsers";
import { detect } from "@/server/detection";
import { correlate } from "@/server/correlation";
import { maskData } from "@/server/export";
import { readStore, audit } from "@/server/adapters/store";
import { distributedRateLimit, clientIp } from "@/server/rate-limit";
export const runtime = "nodejs";
export const maxDuration = 30;
export async function POST(req: NextRequest) {
  try {
    const s = await authorize(req, "write");
    if (!(await distributedRateLimit(`analyze:${s.email}`, 10, 60000)))
      throw new ApiError(429, "rate_limited");
    const events = parseLogs(await readText(req), "file-analysis"),
      alerts = detect(events);
    const result = {
      events,
      alerts,
      cases: correlate(alerts),
      total: events.length,
      persisted: false,
    };
    await audit(s.email, `analyze_file:${events.length}`, clientIp(req));
    return NextResponse.json(
      process.env.IP_MASKING === "1" || (await readStore()).settings.ipMask
        ? maskData(result)
        : result,
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
