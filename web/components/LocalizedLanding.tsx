import Link from "next/link";
import Image from "next/image";
import ContactForm from "./ContactForm";
import ThemeToggle from "./ThemeToggle";
import SetLang from "./SetLang";
import { FadeUp, Stagger, FadeItem } from "./motion";
import { company } from "@/lib/content";
import { dictionaries, type Locale } from "@/lib/i18n";

/** Full localized landing page (used by /fr and /ru) — a real regional page
 *  with its own copy, FAQ and contact block, not a thin duplicate. */
export default function LocalizedLanding({ locale }: { locale: Locale }) {
  const t = dictionaries[locale];

  return (
    <>
      <SetLang lang={t.htmlLang} />
      {/* Minimal localized header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "color-mix(in srgb, var(--bg) 82%, transparent)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div
          className="container"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}
        >
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Star Pass Stone logo" width={50} height={40} className="brand-logo" style={{ height: 40, width: "auto" }} />
            <span style={{ fontFamily: "var(--font-display)", fontSize: 19, color: "var(--text)" }}>
              Starpass Stone
            </span>
          </Link>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <ThemeToggle />
            <Link href="/" className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 13.5 }}>
              {t.switchToEnglish}
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section style={{ position: "relative", padding: "96px 0 90px", overflow: "hidden" }}>
          <div className="hero-aurora" aria-hidden />
          <div className="container" style={{ position: "relative", maxWidth: 860 }}>
            <FadeUp>
              <span className="eyebrow">{t.hero.eyebrow}</span>
              <h1 className="display" style={{ fontSize: "clamp(42px, 6.5vw, 78px)", margin: "22px 0 0" }}>
                {t.hero.title1}
                <br />
                <span className="gold-text">{t.hero.title2}</span>
              </h1>
              <p className="muted" style={{ maxWidth: 620, marginTop: 24, fontSize: 18, lineHeight: 1.7 }}>
                {t.hero.sub}
              </p>
              <div style={{ display: "flex", gap: 14, marginTop: 34, flexWrap: "wrap" }}>
                <a href="#services" className="btn btn-primary">{t.hero.cta}</a>
                <a href="#contact" className="btn btn-ghost">{t.hero.cta2}</a>
              </div>
              <div style={{ display: "flex", gap: 36, marginTop: 44, flexWrap: "wrap" }}>
                {t.stats.map(([v, l]) => (
                  <div key={l}>
                    <div className="gold-text" style={{ fontFamily: "var(--font-display)", fontSize: 30, lineHeight: 1 }}>
                      {v}
                    </div>
                    <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>{l}</div>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="section" style={{ paddingTop: 40 }}>
          <div className="container">
            <FadeUp className="section-head">
              <span className="eyebrow">Starpass Stone</span>
              <h2 className="display section-title">{t.servicesTitle}</h2>
              <p className="section-sub">{t.servicesSub}</p>
            </FadeUp>
            <Stagger
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}
            >
              {t.services.map((s, i) => (
                <FadeItem key={s.title}>
                  <div className="card card-shine" style={{ overflow: "hidden", height: "100%" }}>
                    <div style={{ position: "relative", height: 150 }}>
                      <Image
                        src={`/photos/${[44, 61, 72, 34, 40, 31, 26, 57, 90][i] ?? 26}.jpg`}
                        alt={s.title}
                        fill
                        sizes="280px"
                        style={{ objectFit: "cover" }}
                      />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(8,9,12,0.8))" }} />
                    </div>
                    <div style={{ padding: "16px 18px 20px" }}>
                      <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 400 }}>
                        {s.title}
                      </h3>
                      <p className="muted" style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.55 }}>
                        {s.body}
                      </p>
                    </div>
                  </div>
                </FadeItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* Service area + about */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container" style={{ display: "grid", gap: 18 }}>
            <FadeUp>
              <div className="card" style={{ padding: 30 }}>
                <span className="eyebrow">{t.areaTitle}</span>
                <p style={{ margin: "14px 0 0", fontSize: 16.5, lineHeight: 1.7 }}>{t.areaBody}</p>
              </div>
            </FadeUp>
            <FadeUp>
              <div className="card" style={{ padding: 30 }}>
                <span className="eyebrow">{t.aboutTitle}</span>
                <p className="muted" style={{ margin: "14px 0 0", fontSize: 15.5, lineHeight: 1.7 }}>
                  {t.aboutBody}
                </p>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* FAQ */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container" style={{ maxWidth: 860 }}>
            <FadeUp className="section-head">
              <span className="eyebrow">FAQ</span>
              <h2 className="display section-title">{t.faqTitle}</h2>
            </FadeUp>
            <Stagger style={{ display: "grid", gap: 12 }}>
              {t.faq.map((f) => (
                <FadeItem key={f.q}>
                  <details className="faq-item">
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                </FadeItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <FadeUp>
              <div
                className="card contact-grid-l"
                style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", overflow: "hidden" }}
              >
                <div style={{ padding: "clamp(28px,4vw,54px)" }}>
                  <h2 className="display" style={{ fontSize: "clamp(28px,3.6vw,44px)", margin: 0 }}>
                    {t.contactTitle}
                  </h2>
                  <p className="muted" style={{ marginTop: 16, fontSize: 16, lineHeight: 1.65, maxWidth: 460 }}>
                    {t.contactSub}
                  </p>
                  <div style={{ marginTop: 28, display: "grid", gap: 14, fontSize: 15 }}>
                    <div>
                      <div className="muted" style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 5 }}>
                        {t.labels.area}
                      </div>
                      {t.areaLine}
                    </div>
                    <div>
                      <div className="muted" style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 5 }}>
                        {t.labels.address}
                      </div>
                      {company.address}
                    </div>
                    <div>
                      <div className="muted" style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 5 }}>
                        {t.labels.phone}
                      </div>
                      {company.phones.map((p) => (
                        <a key={p.value} href={p.href} style={{ display: "block", color: "var(--text)", textDecoration: "none" }}>
                          {p.value}
                        </a>
                      ))}
                    </div>
                    <div>
                      <div className="muted" style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 5 }}>
                        {t.labels.email}
                      </div>
                      <a href={`mailto:${company.email}`} style={{ color: "var(--text)", textDecoration: "none" }}>
                        {company.email}
                      </a>
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    padding: "clamp(28px,4vw,54px)",
                    background: "linear-gradient(180deg, rgba(201,168,106,0.08), rgba(255,255,255,0.02))",
                    borderLeft: "1px solid var(--line)",
                  }}
                >
                  <ContactForm labels={t.form} />
                </div>
              </div>
            </FadeUp>
          </div>
          <style>{`@media(max-width:820px){.contact-grid-l{grid-template-columns:1fr !important}.contact-grid-l>div:last-child{border-left:none !important;border-top:1px solid var(--line)}}`}</style>
        </section>
      </main>

      <footer style={{ borderTop: "1px solid var(--line)", padding: "32px 0", textAlign: "center" }}>
        <div className="container muted" style={{ fontSize: 13 }}>
          © {new Date().getFullYear()} {company.legalName} · {t.areaLine}
        </div>
      </footer>
    </>
  );
}
