import { NextRequest,NextResponse } from "next/server";
import { authorize } from "@/server/auth/access";
import { snapshot } from "@/server/services/pipeline";
import { scenarioIds } from "@/server/simulator";
import { readStore } from "@/server/adapters/store";
import { maskData } from "@/server/export";
import { errorResponse } from "@/server/http";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(req:NextRequest){try{const s=await authorize(req);const data=await snapshot(s,req.nextUrl.searchParams.get("source")||"simulation",req.nextUrl.searchParams.get("scenario")||"scheduled");const now=Date.now();const sources=[...new Set(data.events.map(e=>e.source))].map(source=>{const rows=data.events.filter(e=>e.source===source),last=Math.max(...rows.map(e=>e.ts));return {source,last_event:last,eps:rows.filter(e=>e.ts>now-60000).length/60,health:now-last>300000?"silent":"ok"};});const result={...data,events:[...data.events].sort((a,b)=>b.ts-a.ts).slice(0,500),alerts:data.alerts.slice(0,500),total:data.events.length,eps:data.events.filter(e=>e.ts>now-60000).length/60,sources,scenarios:scenarioIds,updated:now};const masked=process.env.IP_MASKING==="1"||(!s.demo&&(await readStore()).settings.ipMask);return NextResponse.json(masked?maskData(result):result,{headers:{"Cache-Control":"no-store"}});}catch(e){return errorResponse(e);}}
