import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";

export type Role = "admin" | "analyst" | "viewer";

export interface Session {
  email: string;
  role: Role;
  demo: boolean;
}

const encoder = new TextEncoder();
export const SESSION_COOKIE = "sops_session";

function key(): Uint8Array {
  const s = process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me-please";
  return encoder.encode(s);
}

export async function createSessionToken(s: Session): Promise<string> {
  return new SignJWT({ email: s.email, role: s.role, demo: s.demo })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(s.demo ? "2h" : "12h")
    .sign(key());
}

export async function verifySessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, key());
    if (typeof payload.email !== "string") return null;
    const role = payload.role;
    if (role !== "admin" && role !== "analyst" && role !== "viewer") return null;
    return { email: payload.email, role, demo: payload.demo === true };
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(req: NextRequest): Promise<Session | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export function canMutate(s: Session | null): boolean {
  return !!s && !s.demo && (s.role === "admin" || s.role === "analyst");
}

export function isAdmin(s: Session | null): boolean {
  return !!s && !s.demo && s.role === "admin";
}
