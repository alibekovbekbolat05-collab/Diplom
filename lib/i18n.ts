import ru from "@/content/messages/ru.json";
import en from "@/content/messages/en.json";
import kk from "@/content/messages/kk.json";
import { site, type Locale } from "@/config/site";

export const dictionaries = { ru, en, kk } as const;

export type Messages = typeof ru;

type Paths<T, P extends string = ""> = T extends object
  ? {
      [K in keyof T & string]: Paths<T[K], P extends "" ? K : `${P}.${K}`>;
    }[keyof T & string]
  : P;

export type MsgKey = Paths<Messages>;

export function isLocale(x: string): x is Locale {
  return (site.locales as readonly string[]).includes(x);
}

export function getMessages(locale: string): Messages {
  if (locale in dictionaries) return dictionaries[locale as Locale];
  return ru;
}

export type TFunc = (key: MsgKey) => string;

export function createT(messages: Record<string, unknown>): TFunc {
  return (key: MsgKey): string => {
    const parts = key.split(".");
    let node: unknown = messages;
    for (const p of parts) {
      if (node && typeof node === "object" && p in (node as Record<string, unknown>)) {
        node = (node as Record<string, unknown>)[p];
      } else {
        return key;
      }
    }
    return typeof node === "string" ? node : key;
  };
}

export function tr(l10n: Record<string, string>, locale: Locale): string {
  return l10n[locale] ?? l10n[site.defaultLocale] ?? Object.values(l10n)[0] ?? "";
}
