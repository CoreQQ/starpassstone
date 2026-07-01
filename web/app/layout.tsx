import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import Tracker from "@/components/Tracker";
import { ToastProvider } from "@/components/Toast";
import { company } from "@/lib/content";

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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s · Starpass Stone" },
  description: DESCRIPTION,
  keywords: [
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
    title: TITLE,
    description:
      "Bespoke natural-stone interiors, fireplaces, hammams and saunas. Crafting in stone since 1998.",
    type: "website",
    url: SITE_URL,
    siteName: company.name,
    locale: "en_IE",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description:
      "Bespoke natural-stone interiors, fireplaces, hammams and saunas. Crafting in stone since 1998.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0b0d" },
    { media: "(prefers-color-scheme: light)", color: "#f6f4ef" },
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
        <ToastProvider>{children}</ToastProvider>
        <Tracker />
      </body>
    </html>
  );
}
