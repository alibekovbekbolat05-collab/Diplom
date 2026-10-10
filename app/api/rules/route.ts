import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { authorize } from "@/server/auth/access";
import { readStore,updateStore,audit } from "@/server/adapters/store";
import { ruleSchema,builtInRules,evaluateRule } from "@/server/rules";
import { eventSchema } from "@/server/schema";
import { ApiError,errorResponse,readJson } from "@/server/http";
import { clientIp } from "@/server/rate-limit";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(req:NextRequest){try{const s=await authorize(req);const data=s.demo?[]:(await readStore()).rules;return NextResponse.json({rules:data.length?data:builtInRules},{headers:{"Cache-Control":"no-store"}});}catch(e){return errorResponse(e);}}
const testSchema=z.object({rule:ruleSchema,events:z.array(eventSchema).max(500)}).strict();
export async function POST(req:NextRequest){try{const s=await authorize(req,"write");const p=testSchema.safeParse(await readJson(req));if(!p.success)throw new ApiError(400,"invalid_rule_test");await audit(s.email,"rule_test",clientIp(req));return NextResponse.json({alerts:evaluateRule(p.data.rule,p.data.events)});}catch(e){return errorResponse(e);}}
export async function PUT(req:NextRequest){try{const s=await authorize(req,"admin");const rules=z.array(ruleSchema).min(1).max(100).safeParse(await readJson(req,200000));if(!rules.success||new Set(rules.data?.map(r=>r.id)).size!==rules.data?.length)throw new ApiError(400,"invalid_rules");await updateStore(data=>{data.rules=rules.data;});await audit(s.email,"rules_update",clientIp(req));return NextResponse.json({rules:rules.data});}catch(e){return errorResponse(e);}}
