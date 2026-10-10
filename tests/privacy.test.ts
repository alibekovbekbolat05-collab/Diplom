import { it, expect } from "vitest";
import { cidrMatch } from "@/server/query";
import { maskData } from "@/server/export";
it("supports IPv6 networks including compressed addresses", () => {
  expect(cidrMatch("2001:db8::123", "2001:db8::/32")).toBe(true);
  expect(cidrMatch("2001:db9::123", "2001:db8::/32")).toBe(false);
  expect(cidrMatch("::1", "::/0")).toBe(true);
  expect(cidrMatch("::ffff:192.0.2.1", "::ffff:192.0.2.0/120")).toBe(true);
  expect(cidrMatch("::1", "::/129")).toBe(false);
});
it("masks IPv6 in raw messages without corrupting timestamps", () => {
  const s = maskData("2001:db8::123 ::1 12:30:00");
  expect(s).not.toContain("2001:db8::123");
  expect(s).toContain("12:30:00");
  expect(s).not.toMatch(/(?:^| )::1(?: |$)/);
});
