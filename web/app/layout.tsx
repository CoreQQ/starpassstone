import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import Tracker from "@/components/Tracker";
import RegisterSW from "@/components/RegisterSW";
import { ToastProvider } from "@/components/Toast";
import { MotionProvider } from "@/components/motion";
import { company } from "@/lib/content";
import { repo } from "@/lib/repo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-fraunces",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://starpassstone.net";
const TITLE =
  "Starpass Stone — Natural Stone Works | Côte d'Azur, Monaco & Ireland";
const DESCRIPTION =
  "Any work with natural stone since 1998: marble, granite, onyx and travertine interiors, fireplaces, hammams, saunas, staircases and countertops. Serving the Côte d'Azur — Nice, Cannes, Monaco, Saint-Tropez — and Dublin, Ireland. Turnkey, from measurement to maintenance.";

/** Metadata with admin-managed SEO overrides layered over the defaults. */
export async function generateMetadata(): Promise<Metadata> {
  let s: Record<string, string> = {};
  try {
    s = await (await repo()).getSettings();
  } catch {
    // Settings unavailable (e.g. cold DB) — fall back to defaults.
  }
  const title = s.seoTitle || TITLE;
  const description = s.seoDescription || DESCRIPTION;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: "%s · Starpass Stone" },
    description,
    keywords: s.seoKeywords
      ? s.seoKeywords.split(",").map((k) => k.trim())
      : [
          "natural stone works",
          "stone masonry",
          "marble work",
          "granite work",
          "marbre Côte d'Azur",
          "travaux de pierre naturelle",
          "работы с камнем",
          "мрамор Лазурный берег",
          "stone contractor French Riviera",
          "marble Nice Cannes Monaco",
          "fireplaces",
          "hammam construction",
          "sauna building",
          "stone countertops",
          "stone staircases",
          "stone bathrooms",
          "onyx",
          "travertine",
          "quartzite",
          "stone interiors",
          "Côte d'Azur",
          "Monaco",
          "Saint-Tropez",
          "Dublin",
        ],
    alternates: {
      canonical: "/",
      languages: { en: "/", fr: "/fr", ru: "/ru", it: "/it" },
    },
    manifest: "/manifest.webmanifest",
    icons: { icon: "/favicon.svg", apple: "/favicon.svg" },
    openGraph: {
      title: s.ogTitle || title,
      description: s.ogDescription || description,
      type: "website",
      url: SITE_URL,
      siteName: company.name,
      locale: "en_IE",
    },
    twitter: {
      card: "summary_large_image",
      title: s.ogTitle || title,
      description: s.ogDescription || description,
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#08090c" },
    { media: "(prefers-color-scheme: light)", color: "#f7f5f0" },
  ],
  width: "device-width",
  initialScale: 1,
};

// Structured data for rich search results and AI answer engines
// (Schema.org LocalBusiness with a full service catalog).
const SERVICES = [
  "Natural stone supply & selection (marble, granite, onyx, travertine, quartzite)",
  "Stone fireplaces — classic, electric and bio",
  "Hammam (Turkish bath) construction",
  "Sauna construction",
  "Stone staircases",
  "Marble columns and architectural elements",
  "Kitchen worktops and table tops",
  "Stone bathrooms",
  "Stone facades and floors",
  "Outdoor BBQ zones and summer kitchens",
  "Stone restoration and maintenance",
  "Interior design projects with author's supervision",
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  "@id": `${SITE_URL}/#business`,
  name: company.name,
  legalName: company.legalName,
  foundingDate: String(company.founded),
  description: DESCRIPTION,
  url: SITE_URL,
  image: [`${SITE_URL}/photos/26.jpg`, `${SITE_URL}/photos/44.jpg`],
  logo: `${SITE_URL}/logo.png`,
  priceRange: "$$$",
  email: company.email,
  telephone: company.phones.map((p) => p.value),
  knowsLanguage: ["en", "fr", "ru", "it", "uk"],
  address: {
    "@type": "PostalAddress",
    streetAddress: "77 Camden Street Lower",
    addressLocality: "Dublin",
    postalCode: "D02 XE80",
    addressCountry: "IE",
  },
  areaServed: [
    { "@type": "Place", name: "Côte d'Azur (French Riviera)" },
    { "@type": "City", name: "Nice" },
    { "@type": "City", name: "Cannes" },
    { "@type": "Country", name: "Monaco" },
    { "@type": "City", name: "Saint-Tropez" },
    { "@type": "City", name: "Antibes" },
    { "@type": "City", name: "Menton" },
    { "@type": "City", name: "Dublin" },
    { "@type": "Country", name: "Ireland" },
    { "@type": "Country", name: "France" },
    { "@type": "Country", name: "Italy" },
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Natural stone works",
    itemListElement: SERVICES.map((name) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name },
    })),
  },
};

// Applies the saved theme before first paint to avoid a flash of the wrong theme.
const themeScript = `(function(){try{var t=localStorage.getItem('sps_theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;}else{document.documentElement.dataset.theme='dark';}}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        style={
          {
            "--font-sans": `var(--font-inter), Inter, system-ui, sans-serif`,
            "--font-display": `var(--font-fraunces), Fraunces, Georgia, serif`,
          } as React.CSSProperties
        }
        className={`${inter.variable} ${fraunces.variable}`}
      >
        <MotionProvider>
          <ToastProvider>{children}</ToastProvider>
        </MotionProvider>
        <Tracker />
        <RegisterSW />
      </body>
    </html>
  );
}
