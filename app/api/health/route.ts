import { NextResponse } from "next/server";
import { storageMode } from "@/server/adapters/store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET() {
  return NextResponse.json(
    {
      ok: true,
      version: 1,
      storage: storageMode(),
      authConfigured:
        !!process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
