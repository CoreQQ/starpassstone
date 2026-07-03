import LocalizedLanding from "@/components/LocalizedLanding";
import { localeMetadata, localeJsonLd } from "@/lib/locale-page";

export const metadata = localeMetadata("ru");

export default function LocalePage() {
  return (
    <>
      {localeJsonLd("ru").map((obj, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}
        />
      ))}
      <LocalizedLanding locale="ru" />
    </>
  );
}
