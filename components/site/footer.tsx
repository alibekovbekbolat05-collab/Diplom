import Link from "next/link";
import { company } from "@/config/company";
import { site } from "@/config/site";
import { getMessages, tr, type Locale } from "@/lib/i18n";

export function Footer({ locale }: { locale: Locale }) {
  const m = getMessages(locale);
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line/60 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-display text-sm font-semibold">{company.name}</p>
          <p className="mt-1 max-w-xs text-sm text-mute">
            {tr(company.tagline, locale)}
          </p>
          <p className="mt-3 text-xs text-mute">
            © {year} {company.legalName}. {m.footer.rights}.
          </p>
        </div>
        <nav
          aria-label="footer"
          className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm"
        >
          <Link
            className="text-mute hover:text-ink"
            href={`/${locale}/product`}
          >
            {m.footer.product}
          </Link>
          <Link
            className="text-mute hover:text-ink"
            href={`/${locale}/api-docs`}
          >
            {m.footer.docs}
          </Link>
          <Link
            className="text-mute hover:text-ink"
            href={`/${locale}/privacy`}
          >
            {m.footer.privacy}
          </Link>
          <Link
            className="text-mute hover:text-ink"
            href={`/${locale}/contact`}
          >
            {m.footer.contact}
          </Link>
          <a
            className="text-mute hover:text-ink"
            href={`mailto:${company.contacts.email}`}
          >
            {company.contacts.email}
          </a>
          <a
            className="text-mute hover:text-ink"
            href={site.socials.telegram}
            rel="noopener noreferrer"
            target="_blank"
          >
            Telegram
          </a>
        </nav>
      </div>
    </footer>
  );
}
