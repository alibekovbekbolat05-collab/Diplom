import { describe, it, expect } from "vitest";
import { dictionaries, createT, isLocale } from "@/lib/i18n";
import { site } from "@/config/site";
import { existsSync } from "node:fs";
function paths(o: object, p = ""): string[] {
  return Object.entries(o)
    .flatMap(([k, v]) =>
      typeof v === "string" ? [`${p}${k}`] : paths(v, `${p}${k}.`),
    )
    .sort();
}
describe("public site", () => {
  it("has equal translation keys", () => {
    expect(paths(dictionaries.en)).toEqual(paths(dictionaries.ru));
    expect(paths(dictionaries.kk)).toEqual(paths(dictionaries.ru));
  });
  it("resolves translations", () =>
    expect(createT(dictionaries.ru)("nav.platform")).toBe("Платформа"));
  it.each(["ru", "en", "kk"])("supports %s", (l) =>
    expect(isLocale(l)).toBe(true),
  );
  it("rejects an unsupported locale", () => expect(isLocale("tr")).toBe(false));
  it.each(site.nav)("has a route for $href", (n) =>
    expect(existsSync(`app/[locale]/(site)${n.href}/page.tsx`)).toBe(true),
  );
});
