import { PageHeading, Section } from "@/components/site/section";
import { pageContext, pageMeta, type PageProps } from "@/lib/metadata";
export async function generateMetadata(p: PageProps) {
  const { locale, m } = await pageContext(p);
  return pageMeta(m.privacy.title, m.privacy.p1, locale, "/privacy");
}
export default async function Privacy(p: PageProps) {
  const { m } = await pageContext(p);
  return (
    <>
      <PageHeading title={m.privacy.title} sub={m.privacy.p1} />
      <Section title={m.footer.privacy}>
        <div className="max-w-3xl space-y-6 leading-relaxed text-mute">
          <p>{m.privacy.p2}</p>
          <p>{m.privacy.p3}</p>
        </div>
      </Section>
    </>
  );
}
