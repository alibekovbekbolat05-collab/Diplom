import type { Metadata } from "next";
import { site } from "@/config/site";
import { getMessages, isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";
export type PageProps = { params: Promise<{ locale: string }> };
export async function pageContext(props: PageProps) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();
  return { locale, m: getMessages(locale) };
}
export function pageMeta(title: string, description: string, locale: string, path = ""): Metadata {
  return { title, description, alternates: { canonical: `${site.url}/${locale}${path}`, languages: Object.fromEntries([...site.locales.map(l => [l, `${site.url}/${l}${path}`]), ["x-default", `${site.url}/ru${path}`]]) }, openGraph: { title, description, url: `${site.url}/${locale}${path}` } };
}
