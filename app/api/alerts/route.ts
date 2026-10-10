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
    const data = await snapshot(
      s,
      req.nextUrl.searchParams.get("source") || "simulation",
      req.nextUrl.searchParams.get("scenario") || "scheduled",
    );
    return NextResponse.json(
      await privateData(
        { alerts: data.alerts, simulation: data.simulation },
        s,
      ),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
