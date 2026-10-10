import type { Metadata } from "next";
import { Inter, Unbounded } from "next/font/google";
import { notFound } from "next/navigation";
import { site } from "@/config/site";
import { company } from "@/config/company";
import { getMessages, isLocale, type Messages } from "@/lib/i18n";
import { MessagesProvider } from "@/components/providers";
import "../globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  variable: "--font-text",
  display: "swap",
});

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  variable: "--font-display",
  display: "swap",
});

export function generateStaticParams() {
  return site.locales.map((locale) => ({ locale }));
}

const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='light')document.documentElement.classList.add('light');}catch(e){}})();`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = getMessages(locale);
  const base = site.url;
  const languages: Record<string, string> = {};
  for (const l of site.locales) languages[l] = `${base}/${l}`;
  languages["x-default"] = `${base}/${site.defaultLocale}`;
  return {
    metadataBase: new URL(base),
    title: {
      default: `${company.name} — ${m.home.heroSub}`,
      template: `%s — ${company.name}`,
    },
    description: m.home.heroSub,
    alternates: { canonical: `${base}/${locale}`, languages },
    openGraph: {
      title: company.name,
      description: m.home.heroSub,
      url: `${base}/${locale}`,
      siteName: company.name,
      images: [{ url: `/api/og?locale=${locale}`, width: 1200, height: 630 }],
      locale,
      type: "website",
    },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages: Messages = getMessages(locale);
  return (
    <html lang={locale} className={`${inter.variable} ${unbounded.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <MessagesProvider messages={messages} locale={locale}>
          {children}
        </MessagesProvider>
      </body>
    </html>
  );
}
