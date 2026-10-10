import { company } from "@/config/company";
import { ContactForm } from "@/components/site/contact-form";
import { PageHeading, Section } from "@/components/site/section";
import { pageContext, pageMeta, type PageProps } from "@/lib/metadata";
export async function generateMetadata(p: PageProps) {
  const { locale, m } = await pageContext(p);
  return pageMeta(m.contact.title, m.contact.sub, locale, "/contact");
}
export default async function Contact(p: PageProps) {
  const { m } = await pageContext(p);
  return (
    <>
      <PageHeading title={m.contact.title} sub={m.contact.sub} />
      <Section title={company.name}>
        <div className="grid gap-8 md:grid-cols-2">
          <ContactForm />
          <div className="space-y-5 p-3">
            <p className="leading-relaxed text-mute">{m.about.disclosure}</p>
            <a
              className="block text-lg text-accent"
              href={`mailto:${company.contacts.email}`}
            >
              {company.contacts.email}
            </a>
            <a
              className="block"
              href={`https://t.me/${company.contacts.telegram}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {m.contact.orTelegram} ↗
            </a>
            <a
              className="block"
              href={`https://wa.me/${company.contacts.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {m.contact.orWhatsapp} ↗
            </a>
          </div>
        </div>
      </Section>
    </>
  );
}
