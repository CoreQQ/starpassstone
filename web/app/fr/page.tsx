import LocalizedLanding from "@/components/LocalizedLanding";
import { localeMetadata, localeJsonLd } from "@/lib/locale-page";

export const metadata = localeMetadata("fr");

export default function FrenchPage() {
  return (
    <>
      {localeJsonLd("fr").map((obj, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}
        />
      ))}
      <LocalizedLanding locale="fr" />
    </>
  );
}
