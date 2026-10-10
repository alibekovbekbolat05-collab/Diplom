import { getMessages } from "@/lib/i18n";
import type { Locale } from "@/config/site";
export function alertLabel(type: string, locale: Locale) {
  const names = getMessages(locale).alertNames;
  return names[type as keyof typeof names] || type.replaceAll("_", " ");
}
