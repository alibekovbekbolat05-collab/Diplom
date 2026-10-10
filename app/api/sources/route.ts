import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/server/auth/access";
import { privateData } from "@/server/privacy";
import { snapshot } from "@/server/services/pipeline";
import { errorResponse } from "@/server/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const s = await authorize(req);
    const data = await privateData(
      await snapshot(
        s,
        req.nextUrl.searchParams.get("source") || "simulation",
        req.nextUrl.searchParams.get("scenario") || "scheduled",
      ),
      s,
    );
    return NextResponse.json(
      {
        sources: [...new Set(data.events.map((e) => e.source))].map(
          (source) => {
            const events = data.events.filter((e) => e.source === source);
            const last = Math.max(...events.map((e) => e.ts));
            return {
              source,
              last_event: last,
              eps: events.filter((e) => Date.now() - e.ts < 60000).length / 60,
              health: Date.now() - last < 5 * 60000 ? "ok" : "silent",
              simulation: data.simulation,
            };
          },
        ),
        simulation: data.simulation,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
