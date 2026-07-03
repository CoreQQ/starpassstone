import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://starpassstone.net";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
      // Explicitly welcome AI answer-engine crawlers (GEO): the business info,
      // services and FAQ on this site are intended to be quotable.
      { userAgent: "GPTBot", allow: "/", disallow: ["/admin", "/api/"] },
      { userAgent: "OAI-SearchBot", allow: "/", disallow: ["/admin", "/api/"] },
      { userAgent: "ChatGPT-User", allow: "/", disallow: ["/admin", "/api/"] },
      { userAgent: "ClaudeBot", allow: "/", disallow: ["/admin", "/api/"] },
      { userAgent: "Claude-Web", allow: "/", disallow: ["/admin", "/api/"] },
      { userAgent: "PerplexityBot", allow: "/", disallow: ["/admin", "/api/"] },
      { userAgent: "Google-Extended", allow: "/", disallow: ["/admin", "/api/"] },
      { userAgent: "Applebot-Extended", allow: "/", disallow: ["/admin", "/api/"] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
