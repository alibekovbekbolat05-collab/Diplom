import { NextRequest } from "next/server";
import { authorize } from "@/server/auth/access";
import { snapshot } from "@/server/services/pipeline";
import { maskData,toCsv } from "@/server/export";
import { readStore,audit } from "@/server/adapters/store";
import { clientIp } from "@/server/rate-limit";
import { ApiError,errorResponse } from "@/server/http";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(req:NextRequest){try{const s=await authorize(req);let data=await snapshot(s,req.nextUrl.searchParams.get("source")||"simulation",req.nextUrl.searchParams.get("scenario")||"all");if(process.env.IP_MASKING==="1"||(!s.demo&&(await readStore()).settings.ipMask))data=maskData(data);const format=req.nextUrl.searchParams.get("format")||"json";if(!["json","csv"].includes(format))throw new ApiError(400,"invalid_format");await audit(s.email,`export_report:${data.alerts.length}`,clientIp(req));const report={generated_at:new Date().toISOString(),simulation:data.simulation,events:data.events.length,alerts:data.alerts,cases:data.cases,assets:data.assets,compliance:{framework:"ISO/IEC 27001:2022",indicative_only:true,controls:["A.8.15 Logging","A.8.16 Monitoring activities","A.5.24 Incident management planning"]}};return new Response(format==="json"?JSON.stringify(report,null,2):toCsv(data.alerts,["id","ts","type","severity","confidence","priority","mitre","simulation"]),{headers:{"Content-Type":format==="json"?"application/json":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="security-report.${format}"`,"Cache-Control":"no-store"}});}catch(e){return errorResponse(e);}}
