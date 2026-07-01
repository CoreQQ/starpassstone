import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Starpass Stone — Natural Stone in Design",
    short_name: "Starpass Stone",
    description:
      "Bespoke natural-stone interiors, fireplaces, hammams and saunas. Crafting in stone since 1998.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0b0d",
    theme_color: "#0a0b0d",
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
