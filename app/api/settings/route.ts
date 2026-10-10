import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorize } from "@/server/auth/access";
import { users } from "@/server/auth/users";
import { isAdmin } from "@/server/auth/session";
import {
  readStore,
  updateStore,
  audit,
  storageMode,
} from "@/server/adapters/store";
import { ApiError, errorResponse, readJson } from "@/server/http";
import { clientIp } from "@/server/rate-limit";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const s = await authorize(req);
    if (!isAdmin(s)) throw new ApiError(403, "forbidden");
    const data = await readStore();
    return NextResponse.json(
      {
        ipMask: data.settings.ipMask,
        storage: storageMode(),
        users: users().map(({ email, role }) => ({ email, role })),
        channels: {
          telegram:
            !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHAT_ID,
          webhook: !!process.env.NOTIFICATION_WEBHOOK_URL,
        },
        tokens: data.tokens.map(({ id, label, created, revoked }) => ({
          id,
          label,
          created,
          revoked,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
export async function PATCH(req: NextRequest) {
  try {
    const s = await authorize(req, "admin");
    const p = z
      .object({ ipMask: z.boolean() })
      .strict()
      .safeParse(await readJson(req, 1000));
    if (!p.success) throw new ApiError(400, "invalid_settings");
    await updateStore((data) => {
      data.settings.ipMask = p.data.ipMask;
    });
    await audit(s.email, "settings_update", clientIp(req));
    return NextResponse.json(p.data);
  } catch (e) {
    return errorResponse(e);
  }
}
