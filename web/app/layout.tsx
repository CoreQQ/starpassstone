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
const TITLE = "Starpass Stone — Natural Stone in Design";
const DESCRIPTION =
  "Since 1998, Starpass Stone designs and crafts natural-stone interiors, fireplaces, hammams, saunas, staircases and countertops. Turnkey service from measurement to maintenance.";

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
          "natural stone",
          "marble",
          "granite",
          "onyx",
          "quartzite",
          "fireplaces",
          "hammam",
          "sauna",
          "countertops",
          "stone interiors",
          "Dublin",
        ],
    alternates: { canonical: "/" },
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

// Structured data for rich search results (Schema.org LocalBusiness).
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  name: company.name,
  legalName: company.legalName,
  foundingDate: String(company.founded),
  description: DESCRIPTION,
  url: SITE_URL,
  email: company.email,
  telephone: company.phones.map((p) => p.value),
  address: {
    "@type": "PostalAddress",
    streetAddress: "77 Camden Street Lower",
    addressLocality: "Dublin",
    postalCode: "D02 XE80",
    addressCountry: "IE",
  },
  areaServed: ["Ireland", "Italy", "Europe"],
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
