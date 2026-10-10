import { NextRequest,NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { ApiError,errorResponse,readJson,sameOrigin } from "@/server/http";
import { clientIp,distributedRateLimit } from "@/server/rate-limit";
import { createSessionToken,getSessionFromRequest,SESSION_COOKIE,sessionCookieOptions,type Session } from "@/server/auth/session";
import { authorize } from "@/server/auth/access";
import { users } from "@/server/auth/users";
import { audit } from "@/server/adapters/store";
export const runtime="nodejs";export const maxDuration=15;
const login=z.object({email:z.string().email().max(254),password:z.string().min(1).max(256)}).strict();
export async function POST(req:NextRequest,ctx:{params:Promise<{action:string}>}){try{sameOrigin(req);const {action}=await ctx.params;const ip=clientIp(req);
 if(action==="logout"){const s=await authorize(req);if(!s.csrf||req.headers.get("x-csrf-token")!==s.csrf)throw new ApiError(403,"invalid_csrf");await audit(s.email,"logout",ip);const response=NextResponse.json({ok:true});response.cookies.set(SESSION_COOKIE,"",{...sessionCookieOptions(),maxAge:0});return response;}
 if(!await distributedRateLimit(`login:${ip}`,8,15*60000))throw new ApiError(429,"login_locked");let session:Session;
 if(action==="demo"){if(process.env.DEMO_MODE_ENABLED==="0")throw new ApiError(403,"demo_disabled");session={email:"demo@secureops.local",role:"viewer",demo:true};}
 else if(action==="login"){const p=login.safeParse(await readJson(req,2048));if(!p.success)throw new ApiError(400,"invalid_login");const u=users().find(u=>u.email===p.data.email.toLowerCase());if(!await distributedRateLimit(`login-account:${p.data.email.toLowerCase()}`,8,15*60000))throw new ApiError(429,"login_locked");const valid=await compare(p.data.password,u?.passwordHash||"$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.");if(!u||!valid){await audit(p.data.email.toLowerCase(),"login_failed",ip);throw new ApiError(401,"invalid_credentials");}session={email:u.email,role:u.role,demo:false};}
 else throw new ApiError(404,"not_found");session.csrf=randomBytes(24).toString("hex");const token=await createSessionToken(session);await audit(session.email,session.demo?"demo_login":"login",ip);const response=NextResponse.json({session},{headers:{"Cache-Control":"no-store"}});response.cookies.set(SESSION_COOKIE,token,{...sessionCookieOptions(),maxAge:session.demo?7200:43200});return response;
 }catch(e){return errorResponse(e);}}
export async function GET(req:NextRequest){const session=await getSessionFromRequest(req);return NextResponse.json({session},{headers:{"Cache-Control":"no-store"}});}
