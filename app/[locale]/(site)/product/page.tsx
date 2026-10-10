import Link from "next/link";
import { PageHeading, Section } from "@/components/site/section";
import { HeroCanvas } from "@/components/viz/hero-canvas";
import { pageContext, pageMeta, type PageProps } from "@/lib/metadata";
export async function generateMetadata(p: PageProps) {
  const { locale, m } = await pageContext(p);
  return pageMeta(m.product.title, m.product.sub, locale, "/product");
}
export default async function Product(p: PageProps) {
  const { locale, m } = await pageContext(p);
  return (
    <>
      <PageHeading title={m.product.title} sub={m.product.sub} />
      <Section title={m.home.pipeline.title}>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            [m.product.f1t, m.product.f1d],
            [m.product.f2t, m.product.f2d],
            [m.product.f3t, m.product.f3d],
            [m.product.f4t, m.product.f4d],
          ].map(([t, d], i) => (
            <article className="panel p-8" key={t}>
              <p className="text-xs text-accent">0{i + 1}</p>
              <h3 className="mt-5 text-xl">{t}</h3>
              <p className="mt-3 text-mute">{d}</p>
            </article>
          ))}
        </div>
        <div className="panel relative mt-8 h-72 overflow-hidden">
          <HeroCanvas className="h-full w-full" />
          <Link
            href={`/${locale}/platform/login?demo=1`}
            className="glow-btn absolute left-8 top-1/2 rounded-xl px-6 py-4"
          >
            {m.product.cta} ↗
          </Link>
          <p className="absolute bottom-5 left-8 text-xs text-mute">
            {m.common.simulation}
          </p>
        </div>
      </Section>
    </>
  );
}
