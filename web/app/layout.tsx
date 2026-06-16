import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Starpass Stone — Natural Stone in Design",
  description:
    "Since 1998, Starpass Stone designs and crafts natural-stone interiors, fireplaces, hammams, saunas, staircases and countertops. Turnkey service from measurement to maintenance.",
  openGraph: {
    title: "Starpass Stone — Natural Stone in Design",
    description:
      "Bespoke natural-stone interiors, fireplaces, hammams and saunas. Crafting in stone since 1998.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={
          {
            "--font-sans": `var(--font-inter), Inter, system-ui, sans-serif`,
            "--font-display": `var(--font-fraunces), Fraunces, Georgia, serif`,
          } as React.CSSProperties
        }
        className={`${inter.variable} ${fraunces.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
