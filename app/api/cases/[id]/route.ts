import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { authorize } from "@/server/auth/access";
import { snapshot } from "@/server/services/pipeline";
import { updateStore,audit } from "@/server/adapters/store";
import { caseSummary } from "@/server/ml/summary";
import { isLocale } from "@/lib/i18n";
import { clientIp } from "@/server/rate-limit";
import { ApiError,errorResponse,readJson } from "@/server/http";
export const runtime="nodejs";export const dynamic="force-dynamic";export const maxDuration=20;
const patch=z.object({status:z.enum(["open","investigating","resolved","false_positive"]).optional(),assignee:z.string().max(254).optional(),notes:z.string().max(4000).optional(),comment:z.string().min(1).max(2000).optional()}).strict().refine(x=>Object.keys(x).length>0);
export async function GET(req:NextRequest,c:{params:Promise<{id:string}>}){try{const s=await authorize(req),{id}=await c.params;const data=await snapshot(s,req.nextUrl.searchParams.get("source")||"simulation",req.nextUrl.searchParams.get("scenario")||"scheduled");const incident=data.cases.find(x=>x.id===id);if(!incident)throw new ApiError(404,"not_found");const alerts=data.alerts.filter(a=>incident.alert_ids.includes(a.id));const l=req.nextUrl.searchParams.get("locale")||"ru";const summary=await caseSummary(incident,alerts,isLocale(l)?l:"ru");return NextResponse.json({incident,alerts,summary},{headers:{"Cache-Control":"no-store"}});}catch(e){return errorResponse(e);}}
export async function PATCH(req:NextRequest,c:{params:Promise<{id:string}>}){try{const s=await authorize(req,"write"),{id}=await c.params;const p=patch.safeParse(await readJson(req,12000));if(!p.success)throw new ApiError(400,"invalid_case_update");const incident=await updateStore(data=>{const row=data.cases.find(x=>x.id===id&&!x.simulation);if(!row)throw new ApiError(404,"not_found");const {comment,...fields}=p.data;Object.assign(row,fields);if(comment){row.comments.push({ts:Date.now(),email:s.email,text:comment});row.comments=row.comments.slice(-100);}return row;});await audit(s.email,`case_update:${id}`,clientIp(req));return NextResponse.json({incident});}catch(e){return errorResponse(e);}}
