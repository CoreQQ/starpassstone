// Shared metadata + JSON-LD builders for the localized landing pages.

import type { Metadata } from "next";
import { dictionaries, type Locale } from "./i18n";
import { company } from "./content";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://starpassstone.net";

export function localeMetadata(locale: Locale): Metadata {
  const t = dictionaries[locale];
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    keywords: t.keywords,
    alternates: {
      canonical: `/${locale}`,
      languages: { en: "/", fr: "/fr", ru: "/ru", it: "/it" },
    },
    openGraph: {
      title: t.metaTitle,
      description: t.metaDescription,
      type: "website",
      url: `${SITE_URL}/${locale}`,
      siteName: company.name,
      locale: locale === "fr" ? "fr_FR" : locale === "it" ? "it_IT" : "ru_RU",
    },
    robots: { index: true, follow: true },
  };
}

/** Localized FAQPage + LocalBusiness JSON-LD for the landing page. */
export function localeJsonLd(locale: Locale): object[] {
  const t = dictionaries[locale];
  return [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: t.htmlLang,
      mainEntity: t.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "HomeAndConstructionBusiness",
      "@id": `${SITE_URL}/#business`,
      name: company.name,
      url: `${SITE_URL}/${locale}`,
      inLanguage: t.htmlLang,
      description: t.metaDescription,
      telephone: company.phones.map((p) => p.value),
      email: company.email,
      areaServed: [
        { "@type": "Place", name: "Côte d'Azur" },
        { "@type": "City", name: "Nice" },
        { "@type": "City", name: "Cannes" },
        { "@type": "Country", name: "Monaco" },
        { "@type": "City", name: "Saint-Tropez" },
        { "@type": "City", name: "Antibes" },
        { "@type": "Country", name: "Ireland" },
      ],
    },
  ];
}
