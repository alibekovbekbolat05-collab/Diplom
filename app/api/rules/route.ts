import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/server/auth/session";
import { authorize } from "@/server/auth/access";
import { readStore, updateStore, audit } from "@/server/adapters/store";
import { ruleSchema, builtInRules, evaluateRule } from "@/server/rules";
import { eventSchema } from "@/server/schema";
import { ApiError, errorResponse, readJson } from "@/server/http";
import { clientIp } from "@/server/rate-limit";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const s = await authorize(req);
    const data = s.demo ? [] : (await readStore()).rules;
    return NextResponse.json(
      { rules: data.length ? data : builtInRules },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
const testSchema = z
  .object({ rule: ruleSchema, events: z.array(eventSchema).max(500) })
  .strict();
export async function POST(req: NextRequest) {
  try {
    const s = await authorize(req, "write");
    const body = await readJson(req);
    const p = testSchema.safeParse(body);
    if (!p.success) {
      if (!isAdmin(s)) throw new ApiError(403, "forbidden");
      const created = ruleSchema.safeParse(body);
      if (!created.success) throw new ApiError(400, "invalid_rule");
      await updateStore((data) => {
        const existing = data.rules.length
          ? data.rules.map((r) => ruleSchema.parse(r))
          : [...builtInRules];
        if (
          existing.length >= 100 ||
          existing.some((r) => r.id === created.data.id)
        )
          throw new ApiError(409, "rule_conflict");
        data.rules = [...existing, created.data];
      });
      await audit(s.email, `rule_create:${created.data.id}`, clientIp(req));
      return NextResponse.json(
        { rule: created.data },
        { status: 201, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (!p.success) throw new ApiError(400, "invalid_rule_test");
    await audit(s.email, "rule_test", clientIp(req));
    return NextResponse.json({
      alerts: evaluateRule(p.data.rule, p.data.events),
    });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function PUT(req: NextRequest) {
  try {
    const s = await authorize(req, "admin");
    const rules = z
      .array(ruleSchema)
      .min(1)
      .max(100)
      .safeParse(await readJson(req, 200000));
    if (
      !rules.success ||
      new Set(rules.data?.map((r) => r.id)).size !== rules.data?.length
    )
      throw new ApiError(400, "invalid_rules");
    await updateStore((data) => {
      data.rules = rules.data;
    });
    await audit(s.email, "rules_update", clientIp(req));
    return NextResponse.json({ rules: rules.data });
  } catch (e) {
    return errorResponse(e);
  }
}

const changeSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9_-]{1,64}$/),
    changes: ruleSchema
      .omit({ id: true })
      .partial()
      .refine((x) => Object.keys(x).length > 0),
  })
  .strict();
export async function PATCH(req: NextRequest) {
  try {
    const s = await authorize(req, "admin");
    const p = changeSchema.safeParse(await readJson(req, 12000));
    if (!p.success) throw new ApiError(400, "invalid_rule_patch");
    const rule = await updateStore((data) => {
      const existing = data.rules.length
        ? data.rules.map((r) => ruleSchema.parse(r))
        : [...builtInRules];
      const index = existing.findIndex((r) => r.id === p.data.id);
      if (index < 0) throw new ApiError(404, "not_found");
      const changed = ruleSchema.safeParse({
        ...existing[index],
        ...p.data.changes,
      });
      if (!changed.success) throw new ApiError(400, "invalid_rule");
      existing[index] = changed.data;
      data.rules = existing;
      return changed.data;
    });
    await audit(s.email, `rule_update:${p.data.id}`, clientIp(req));
    return NextResponse.json(
      { rule },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
