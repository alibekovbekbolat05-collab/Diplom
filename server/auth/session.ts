import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";
export type Role = "admin" | "analyst" | "viewer";
export interface Session {
  email: string;
  role: Role;
  demo: boolean;
  csrf?: string;
}
const encoder = new TextEncoder();
export const SESSION_COOKIE = "sops_session";
function key() {
  const secret = process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32))
    throw new Error("AUTH_SECRET must have at least 32 characters");
  return encoder.encode(
    secret || "development-only-secret-at-least-32-characters",
  );
}
export async function createSessionToken(s: Session) {
  if (s.demo && s.role !== "viewer")
    throw new Error("Demo role must be viewer");
  return new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("secureops")
    .setAudience("secureops-console")
    .setIssuedAt()
    .setExpirationTime(s.demo ? "2h" : "12h")
    .sign(key());
}
export async function verifySessionToken(
  token: string,
): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, key(), {
      algorithms: ["HS256"],
      issuer: "secureops",
      audience: "secureops-console",
    });
    if (
      typeof payload.email !== "string" ||
      !["admin", "analyst", "viewer"].includes(String(payload.role)) ||
      typeof payload.demo !== "boolean" ||
      (payload.demo && payload.role !== "viewer")
    )
      return null;
    return {
      email: payload.email,
      role: payload.role as Role,
      demo: payload.demo,
      csrf: typeof payload.csrf === "string" ? payload.csrf : undefined,
    };
  } catch {
    return null;
  }
}
export async function getSessionFromRequest(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token) : null;
}
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}
export { canMutate, isAdmin } from "@/lib/permissions";
