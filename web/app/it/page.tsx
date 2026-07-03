import LocalizedLanding from "@/components/LocalizedLanding";
import { localeMetadata, localeJsonLd } from "@/lib/locale-page";

export const metadata = localeMetadata("it");

export default function LocalePage() {
  return (
    <>
      {localeJsonLd("it").map((obj, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}
        />
      ))}
      <LocalizedLanding locale="it" />
    </>
  );
}
