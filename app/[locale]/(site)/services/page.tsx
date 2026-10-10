import Link from "next/link";
import { PageHeading, Section } from "@/components/site/section";
import { pageContext, pageMeta, type PageProps } from "@/lib/metadata";
export async function generateMetadata(p: PageProps) {
  const { locale, m } = await pageContext(p);
  return pageMeta(m.services.title, m.services.sub, locale, "/services");
}
export default async function Services(p: PageProps) {
  const { locale, m } = await pageContext(p);
  return (
    <>
      <PageHeading title={m.services.title} sub={m.services.sub} />
      <Section title={m.about.mission}>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            m.services.monitoring,
            m.services.response,
            m.services.audit,
            m.services.training,
          ].map((s, i) => (
            <article
              key={s.t}
              className={`panel flex min-h-60 flex-col p-8 ${i === 0 || i === 3 ? "md:col-span-2" : ""}`}
            >
              <span className="font-mono text-xs text-accent">
                S / 0{i + 1}
              </span>
              <h3 className="mt-8 font-display text-xl">{s.t}</h3>
              <p className="mb-8 mt-4 text-mute">{s.d}</p>
              <Link
                className="mt-auto text-sm text-accent"
                href={`/${locale}/contact`}
              >
                {m.home.ctaContact} ↗
              </Link>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
