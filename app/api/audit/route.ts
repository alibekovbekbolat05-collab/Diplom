import { NextRequest, NextResponse } from "next/server";
import { maskData } from "@/server/export";
import { authorize } from "@/server/auth/access";
import { readStore } from "@/server/adapters/store";
import { ApiError, errorResponse } from "@/server/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const s = await authorize(req);
    if (s.role !== "admin" || s.demo) throw new ApiError(403, "forbidden");
    const store = await readStore();
    return NextResponse.json(
      {
        audit:
          process.env.IP_MASKING === "1" || store.settings.ipMask
            ? maskData(store.audit.slice(-500).reverse())
            : store.audit.slice(-500).reverse(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
