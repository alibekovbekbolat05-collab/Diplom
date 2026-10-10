import { describe, it, expect } from "vitest";
import { compileQuery, cidrMatch } from "@/server/query";
import { csvCell, maskData } from "@/server/export";
import { normalize } from "@/server/parsers";
const e = normalize({
  ts: 1700000000000,
  host: "srv",
  event_action: "login",
  event_category: "authentication",
  outcome: "failure",
  src_ip: "10.1.2.3",
});
describe("event query", () => {
  it("matches fields", () =>
    expect(compileQuery("host:srv AND outcome:failure")(e)).toBe(true));
  it("handles OR and NOT", () =>
    expect(compileQuery("host:other OR NOT outcome:success")(e)).toBe(true));
  it("handles parentheses", () =>
    expect(
      compileQuery("(host:srv OR host:other) AND outcome:failure")(e),
    ).toBe(true));
  it("supports IPv4 CIDR", () =>
    expect(compileQuery("src_ip:10.0.0.0/8")(e)).toBe(true));
  it("rejects invalid fields", () =>
    expect(() => compileQuery("__proto__:x")).toThrow());
  it("rejects malformed queries", () =>
    expect(() => compileQuery("host:srv AND")).toThrow());
  it("supports /0", () =>
    expect(cidrMatch("10.1.2.3", "0.0.0.0/0")).toBe(true));
  it("rejects bad ranges", () =>
    expect(cidrMatch("10.1.2.3", "10.0.0.0/45")).toBe(false));
});
describe("safe export", () => {
  it.each(["=1+1", "+SUM(A1)", "-1", "@x", "  =cmd"])("neutralizes %s", (s) =>
    expect(csvCell(s).startsWith("\"'")).toBe(true),
  );
  it("quotes delimiters", () => expect(csvCell('a,"b')).toBe('"a,""b"'));
  it("masks nested addresses", () =>
    expect(maskData({ raw: "10.1.2.3", nested: ["192.0.2.1"] })).toEqual({
      raw: "10.1.2.xxx",
      nested: ["192.0.2.xxx"],
    }));
});
