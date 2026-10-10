import { NextRequest,NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { ApiError,errorResponse,readText } from "@/server/http";
import { constantEqual } from "@/server/auth/access";
import { distributedRateLimit,clientIp } from "@/server/rate-limit";
import { readStore,audit } from "@/server/adapters/store";
import { processEvents } from "@/server/services/pipeline";
import { notifyNewCases } from "@/server/notifications";
import { parseLogs } from "@/server/parsers";
export const runtime="nodejs";export const maxDuration=30;
export async function POST(req:NextRequest){try{if(!await distributedRateLimit(`ingest:${clientIp(req)}`,60,60000))throw new ApiError(429,"rate_limited");const token=req.headers.get("authorization")?.match(/^Bearer (.{1,256})$/)?.[1];if(!token)throw new ApiError(401,"unauthorized");const bootstrap=process.env.INGEST_TOKEN;let label="api";if(!bootstrap||!constantEqual(token,bootstrap)){const hash=createHash("sha256").update(token).digest("hex");const valid=(await readStore()).tokens.find(t=>!t.revoked&&constantEqual(t.hash,hash));if(!valid)throw new ApiError(401,"unauthorized");label=valid.label;}const events=parseLogs(await readText(req),label);const result=await processEvents(events);const count=result.accepted;await notifyNewCases(result.newCaseIds);await audit(`ingest:${label}`,`ingest:${count}`,clientIp(req));return NextResponse.json({accepted:result.accepted,alerts:result.alerts,simulation:false},{status:202});}catch(e){return errorResponse(e);}}
