import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/server/auth/access";
import { selectedEvents } from "@/server/services/data";
import { ApiError, errorResponse } from "@/server/http";
import { compileQuery } from "@/server/query";
import { toCsv, maskData } from "@/server/export";
import { readStore, audit } from "@/server/adapters/store";
import { clientIp } from "@/server/rate-limit";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const s = await authorize(req);
    const q = req.nextUrl.searchParams;
    const source = s.demo ? "simulation" : q.get("source") || "simulation";
    const predicate = compileQuery(q.get("q") || "");
    const from = q.get("from") ? Date.parse(q.get("from")!) : 0,
      to = q.get("to") ? Date.parse(q.get("to")!) : Infinity;
    if (Number.isNaN(from) || Number.isNaN(to) || from > to)
      throw new ApiError(400, "invalid_time_range");
    let events = (
      await selectedEvents(s, source, q.get("scenario") || "scheduled")
    )
      .filter((e) => predicate(e) && e.ts >= from && e.ts <= to)
      .sort((a, b) => b.ts - a.ts);
    if (
      process.env.IP_MASKING === "1" ||
      (!s.demo && (await readStore()).settings.ipMask)
    )
      events = maskData(events);
    const format = q.get("format");
    if (format) {
      if (!["csv", "json"].includes(format))
        throw new ApiError(400, "invalid_format");
      await audit(s.email, `export_events:${events.length}`, clientIp(req));
      return new Response(
        format === "json"
          ? JSON.stringify({ events, simulation: source !== "ingested" })
          : toCsv(events, [
              "ts",
              "host",
              "event_category",
              "event_action",
              "outcome",
              "src_ip",
              "dst_ip",
              "user",
              "simulation",
            ]),
        {
          headers: {
            "Content-Type":
              format === "json"
                ? "application/json"
                : "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="events.${format}"`,
            "Cache-Control": "no-store",
          },
        },
      );
    }
    return NextResponse.json(
      {
        events: events.slice(0, 500),
        total: events.length,
        simulation: source !== "ingested",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
