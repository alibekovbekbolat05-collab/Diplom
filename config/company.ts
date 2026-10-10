export const company = {
  name: "Aspan Security",
  legalName: 'TOO "Aspan Security"',
  consoleName: "SecureOps Console",
  tagline: {
    ru: "Мониторинг ИБ 24/7 для малого и среднего бизнеса",
    en: "24/7 security monitoring for SMB",
    kk: "ШОБ үшін тәулік бойы қауіпсіздік мониторингі",
  },
  founded: 2021,
  contacts: {
    email: "info@aspan-security.kz",
    phone: "+7 700 000 00 00",
    phoneHref: "+77000000000",
    address: "Almaty, Al-Farabi Ave 77/8",
    telegram: "aspan_security",
    whatsapp: "77000000000",
  },
  legal: {
    bin: "210140012345",
    registration: "Ministry of Justice of RK, Almaty",
  },
  diploma: {
    author: "Bekbolat Yerlanuly",
    supervisor: "Zhandos A. Sarsenov, PhD",
    university: "Satbayev University",
    department: "Information Security Department",
    year: 2026,
  },
} as const;

export type Company = typeof company;
