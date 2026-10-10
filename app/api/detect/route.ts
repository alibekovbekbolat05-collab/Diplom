import { NextRequest,NextResponse } from "next/server";
import { authorize } from "@/server/auth/access";
import { parseLogs } from "@/server/parsers";
import { readText,ApiError,errorResponse } from "@/server/http";
import { distributedRateLimit,clientIp } from "@/server/rate-limit";
import { detect } from "@/server/detection";
import { correlate } from "@/server/correlation";
export const runtime="nodejs";export const maxDuration=30;
export async function POST(req:NextRequest){try{await authorize(req,"write");if(!await distributedRateLimit(`detect:${clientIp(req)}`,20,60000))throw new ApiError(429,"rate_limited");const events=parseLogs(await readText(req),"detect");const alerts=detect(events);return NextResponse.json({events:events.length,alerts,cases:correlate(alerts),simulation:false});}catch(e){return errorResponse(e);}}
