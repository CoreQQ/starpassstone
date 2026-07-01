import Header from "@/components/Header";
import Hero from "@/components/Hero";
import {
  Marquee,
  DesignSection,
  Stones,
  Products,
  Hamam,
  Sauna,
  About,
  Contact,
  Footer,
} from "@/components/Sections";
import { repo } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function Home() {
  const content = await (await repo()).getContent();
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Marquee />
        <DesignSection />
        <Stones />
        <Products items={content.products} />
        <Hamam gallery={content.hamamGallery} />
        <Sauna gallery={content.saunaGallery} />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
