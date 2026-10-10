import { NextResponse } from "next/server";
import { SIM_SEED, SIM_HOSTS, SIM_USERS, generateWindow } from "@/server/simulator";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = Date.now();
  const events = generateWindow(SIM_SEED, now - 60_000, now, 6000);
  const eps = Math.round((events.length / 60) * 10) / 10;
  return NextResponse.json(
    {
      eps,
      alerts: 0,
      cases: 0,
      assets: SIM_HOSTS.length + SIM_USERS.length,
      simulation: true,
    },
    { headers: { "cache-control": "no-store" } }
  );
}
