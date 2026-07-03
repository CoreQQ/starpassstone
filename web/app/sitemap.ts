import type { MetadataRoute } from "next";
import { nav } from "@/lib/content";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://starpassstone.net";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const home = {
    url: SITE_URL,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 1,
  };
  // The site is a single scrolling page; expose its sections as anchors.
  const sections = nav.map((n) => ({
    url: `${SITE_URL}/#${n.id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [home, ...sections];
}
