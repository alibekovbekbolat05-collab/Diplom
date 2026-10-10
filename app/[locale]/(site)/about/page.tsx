import { company } from "@/config/company";
import { PageHeading, Section } from "@/components/site/section";
import { pageContext, pageMeta, type PageProps } from "@/lib/metadata";
export async function generateMetadata(p: PageProps) {
  const { locale, m } = await pageContext(p);
  return pageMeta(m.about.title, m.about.mission, locale, "/about");
}
export default async function About(p: PageProps) {
  const { m } = await pageContext(p);
  const d = company.diploma;
  return (
    <>
      <PageHeading title={m.about.title} sub={m.about.mission} />
      <Section title={m.about.diplomaT}>
        <p className="mb-8 max-w-3xl leading-relaxed text-mute">
          {m.about.disclosure}
        </p>
        <dl className="grid gap-4 sm:grid-cols-2">
          {[
            [m.about.author, d.author],
            [m.about.supervisor, d.supervisor],
            [m.about.university, d.university],
            [m.about.dept, d.department],
            [m.about.year, String(d.year)],
          ].map(([k, v]) => (
            <div key={k} className="panel p-6">
              <dt className="text-xs text-mute">{k}</dt>
              <dd className="mt-3 text-lg">{v}</dd>
            </div>
          ))}
        </dl>
      </Section>
    </>
  );
}
