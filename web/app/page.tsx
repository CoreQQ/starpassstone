import Header from "@/components/Header";
import Hero from "@/components/Hero";
import BannerBar from "@/components/BannerBar";
import {
  Marquee,
  Advantages,
  DesignSection,
  Stones,
  Products,
  Hamam,
  Sauna,
  GallerySection,
  News,
  About,
  Faq,
  Contact,
  Footer,
} from "@/components/Sections";
import { repo } from "@/lib/repo";
import { faq } from "@/lib/content";

export const dynamic = "force-dynamic";

// FAQPage structured data for rich results.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default async function Home() {
  const r = await repo();
  const [content, news, banners, settings] = await Promise.all([
    r.getContent(),
    r.listNews(true),
    r.listBanners(true),
    r.getSettings(),
  ]);

  // Fall back to the "announcement" setting when no banners are configured.
  const activeBanners =
    banners.length > 0
      ? banners
      : settings.announcement
        ? [{ id: "announcement", text: settings.announcement, href: "", active: true, position: 0 }]
        : [];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <BannerBar banners={activeBanners} />
      <Header />
      <main>
        <Hero />
        <Marquee />
        <Advantages />
        <DesignSection />
        <Stones />
        <Products items={content.products} />
        <Hamam gallery={content.hamamGallery} />
        <Sauna gallery={content.saunaGallery} />
        <GallerySection items={content.portfolio} />
        <News posts={news} />
        <About />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
