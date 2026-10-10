import { StructuredData } from "@/components/site/structured-data";
import { LiquidNav } from "@/components/site/liquid-nav";
import { PageShell } from "@/components/site/page-shell";
import { SmoothScroll } from "@/components/site/smooth-scroll";
import { CustomCursor } from "@/components/site/cursor";
import { FloatingContacts } from "@/components/site/floating-contacts";
import { Footer } from "@/components/site/footer";
import { isLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <><StructuredData/>
      <SmoothScroll />
      <CustomCursor />
      <LiquidNav />
      <PageShell>{children}</PageShell>
      <Footer locale={locale as Locale} />
      <FloatingContacts />
    </>
  );
}
