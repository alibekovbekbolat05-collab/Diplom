import { NextRequest,NextResponse } from "next/server";
import { authorize } from "@/server/auth/access";
import { selectedEvents } from "@/server/services/data";
import { errorResponse } from "@/server/http";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(req:NextRequest){try{const s=await authorize(req);const source=s.demo?"simulation":req.nextUrl.searchParams.get("source")||"simulation";const events=await selectedEvents(s,source);return NextResponse.json({events:events.slice(-500).reverse(),total:events.length,simulation:source!=="ingested"},{headers:{"Cache-Control":"no-store"}});}catch(e){return errorResponse(e);}}
