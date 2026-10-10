import { describe, it, expect } from "vitest";
import { ruleSchema, evaluateRule, builtInRules } from "@/server/rules";
import { parseLogs } from "@/server/parsers";
import { maskData, toCsv } from "@/server/export";
describe("Administrative workflows", () => {
  it("rejects executable operators and dangerous fields", () => {
    expect(
      ruleSchema.safeParse({
        ...builtInRules[0],
        conditions: [{ field: "__proto__", op: "eval", value: "alert(1)" }],
      }).success,
    ).toBe(false);
  });
  it("tests disabled and threshold rules without mutation", () => {
    const events = parseLogs(
      JSON.stringify(
        Array.from({ length: 10 }, (_, i) => ({
          ts: 1700000000000 + i,
          host: "sample",
          dst_port: 22,
          event_action: "login",
          event_category: "authentication",
          outcome: "failure",
        })),
      ),
    );
    expect(evaluateRule(builtInRules[0], events)).toHaveLength(1);
    expect(
      evaluateRule({ ...builtInRules[0], enabled: false }, events),
    ).toHaveLength(0);
  });
  it("escapes formulas and masks nested export data", () => {
    expect(toCsv([{ x: "=cmd()" }], ["x"])).toContain("'=cmd()");
    expect(
      maskData({ raw: "source 10.2.3.4", nested: [{ dst_ip: "192.0.2.5" }] }),
    ).toEqual({
      raw: "source 10.2.3.xxx",
      nested: [{ dst_ip: "192.0.2.xxx" }],
    });
  });
});
