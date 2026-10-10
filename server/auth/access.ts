import type { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getSessionFromRequest,canMutate,isAdmin,type Session } from "./session";
import { ApiError,sameOrigin } from "@/server/http";
export function constantEqual(a:string,b:string){const aa=Buffer.from(a),bb=Buffer.from(b);return aa.length===bb.length&&timingSafeEqual(aa,bb);}
export async function authorize(req:NextRequest,permission:"read"|"write"|"admin"="read"):Promise<Session>{const session=await getSessionFromRequest(req);if(!session)throw new ApiError(401,"unauthorized");if(permission!=="read"){sameOrigin(req);if(!session.csrf||!constantEqual(req.headers.get("x-csrf-token")||"",session.csrf))throw new ApiError(403,"invalid_csrf");if(permission==="admin"?!isAdmin(session):!canMutate(session))throw new ApiError(403,"forbidden");}return session;}
