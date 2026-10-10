import type { Session } from "@/server/auth/session";
export function canMutate(s: Session | null) {
  return !!s && !s.demo && (s.role === "admin" || s.role === "analyst");
}
export function isAdmin(s: Session | null) {
  return !!s && !s.demo && s.role === "admin";
}
