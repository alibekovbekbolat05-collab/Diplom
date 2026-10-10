import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { authorize } from "@/server/auth/access";
import { updateStore, audit } from "@/server/adapters/store";
import { ApiError, errorResponse, readJson } from "@/server/http";
import { clientIp } from "@/server/rate-limit";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    const s = await authorize(req, "admin");
    const p = z
      .object({ label: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/) })
      .strict()
      .safeParse(await readJson(req, 1000));
    if (!p.success) throw new ApiError(400, "invalid_label");
    const token = randomBytes(32).toString("base64url"),
      id = randomUUID();
    await updateStore((data) => {
      if (data.tokens.filter((t) => !t.revoked).length >= 50)
        throw new ApiError(400, "token_limit");
      data.tokens = data.tokens.filter((t) => !t.revoked);
      data.tokens.push({
        id,
        label: p.data.label,
        hash: createHash("sha256").update(token).digest("hex"),
        created: Date.now(),
        revoked: false,
      });
    });
    await audit(s.email, `token_created:${id}`, clientIp(req));
    return NextResponse.json(
      { id, token },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
export async function DELETE(req: NextRequest) {
  try {
    const s = await authorize(req, "admin");
    const p = z
      .object({ id: z.string().uuid() })
      .strict()
      .safeParse(await readJson(req, 1000));
    if (!p.success) throw new ApiError(400, "invalid_id");
    await updateStore((data) => {
      const t = data.tokens.find((t) => t.id === p.data.id);
      if (!t) throw new ApiError(404, "not_found");
      t.revoked = true;
    });
    await audit(s.email, `token_revoked:${p.data.id}`, clientIp(req));
    return NextResponse.json({ revoked: true });
  } catch (e) {
    return errorResponse(e);
  }
}
