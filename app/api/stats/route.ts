import { NextRequest,NextResponse } from "next/server";
import { getSessionFromRequest } from "@/server/auth/session";
import { snapshot } from "@/server/services/pipeline";
import { errorResponse } from "@/server/http";
export const dynamic="force-dynamic";export const runtime="nodejs";
export async function GET(req:NextRequest){try{const session=await getSessionFromRequest(req)||{email:"public",role:"viewer" as const,demo:true};const s=await snapshot(session,req.nextUrl.searchParams.get("source")||"simulation");return NextResponse.json({eps:Math.round(s.events.filter(e=>e.ts>Date.now()-60000).length/6)/10,alerts:s.alerts.length,cases:s.cases.length,assets:s.assets.length,simulation:s.simulation},{headers:{"Cache-Control":"no-store"}});}catch(e){return errorResponse(e);}}
