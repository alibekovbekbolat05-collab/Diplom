import { readStore } from "@/server/adapters/store";
import { maskData } from "@/server/export";
import type { Session } from "@/server/auth/session";
export async function privateData<T>(data: T, s: Session) {
  return process.env.IP_MASKING === "1" ||
    (!s.demo && (await readStore()).settings.ipMask)
    ? maskData(data)
    : data;
}
