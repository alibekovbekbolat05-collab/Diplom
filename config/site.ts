import { company } from "./company";

export const site = {
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://aspan-security.vercel.app",
  locales: ["ru", "en", "kk"] as const,
  defaultLocale: "ru" as const,
  nav: [
    { key: "nav.platform", href: "/product" },
    { key: "nav.services", href: "/services" },
    { key: "nav.method", href: "/method" },
    { key: "nav.about", href: "/about" },
    { key: "nav.contact", href: "/contact" },
  ],
  platformPath: "/platform",
  socials: {
    telegram: `https://t.me/${company.contacts.telegram}`,
  },
} as const;

export type Locale = (typeof site.locales)[number];
