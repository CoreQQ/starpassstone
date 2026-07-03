"use client";

import { company, stones } from "@/lib/content";
import ContactForm from "./ContactForm";
import { m } from "./motion";
import { useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Hero() {
  const reduced = useReducedMotion();
  const anim = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 30 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, ease: EASE, delay },
        };

  return (
    <section
      id="top"
      style={{
        position: "relative",
        paddingTop: 96,
        paddingBottom: 100,
        overflow: "hidden",
      }}
    >
      <div className="hero-aurora" aria-hidden />

      <div
        className="container hero-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1.15fr 0.85fr",
          gap: 60,
          alignItems: "center",
          position: "relative",
        }}
      >
        <div>
          <m.div {...anim(0)}>
            <span className="eyebrow">Crafting in stone since {company.founded}</span>
          </m.div>

          <m.h1
            className="display"
            style={{ fontSize: "clamp(46px, 7.4vw, 92px)", margin: "24px 0 0" }}
            {...anim(0.08)}
          >
            Natural stone
            <br />
            <span className="gold-text">in design.</span>
          </m.h1>

          <m.p
            className="muted"
            style={{ maxWidth: 540, marginTop: 26, fontSize: 18, lineHeight: 1.7 }}
            {...anim(0.16)}
          >
            Bespoke interiors, fireplaces, hammams and saunas in marble, granite,
            onyx and quartzite — engineered and installed turnkey, from the first
            measurement to lifelong maintenance.
          </m.p>

          <m.div
            style={{ display: "flex", gap: 14, marginTop: 38, flexWrap: "wrap" }}
            {...anim(0.24)}
          >
            <a href="#products" className="btn btn-primary">
              Explore our work
            </a>
            <a href="#contact" className="btn btn-ghost">
              Talk to a specialist
            </a>
          </m.div>

          {/* Stone palette chips — a quiet nod to the material itself */}
          <m.div
            style={{ display: "flex", gap: 10, marginTop: 44, flexWrap: "wrap" }}
            {...anim(0.32)}
          >
            {stones.map((s) => (
              <span
                key={s.name}
                title={s.note}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  border: "1px solid var(--line)",
                  borderRadius: 999,
                  padding: "7px 14px 7px 8px",
                  fontSize: 12.5,
                  color: "var(--muted)",
                  background: "var(--panel)",
                  backdropFilter: "blur(6px)",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: `radial-gradient(circle at 30% 30%, ${s.accent}, ${s.color})`,
                    border: "1px solid var(--line-strong)",
                  }}
                />
                {s.name}
              </span>
            ))}
          </m.div>

          <m.div
            style={{ display: "flex", gap: 36, marginTop: 44, flexWrap: "wrap" }}
            {...anim(0.4)}
          >
            {[
              ["25+", "Years of craft"],
              ["A→Z", "Turnkey service"],
              ["100%", "Natural stone"],
            ].map(([v, l]) => (
              <div key={l}>
                <div
                  className="gold-text"
                  style={{ fontFamily: "var(--font-display)", fontSize: 32, lineHeight: 1 }}
                >
                  {v}
                </div>
                <div className="muted" style={{ fontSize: 13, marginTop: 7 }}>
                  {l}
                </div>
              </div>
            ))}
          </m.div>
        </div>

        <m.div
          className="card card-shine hero-card"
          style={{ padding: 28, position: "relative" }}
          {...(reduced
            ? {}
            : {
                initial: { opacity: 0, y: 40, scale: 0.97 },
                animate: { opacity: 1, y: 0, scale: 1 },
                transition: { duration: 0.9, ease: EASE, delay: 0.3 },
              })}
        >
          <div style={{ fontFamily: "var(--font-display)", fontSize: 23 }}>
            Contact us
          </div>
          <p className="muted" style={{ fontSize: 14, margin: "8px 0 18px" }}>
            Leave your details and we will contact you on WhatsApp — or call us
            directly.
          </p>
          <ContactForm compact />
          <div className="hairline" style={{ margin: "20px 0" }} />
          <a
            href={company.phones[0].href}
            style={{
              textDecoration: "none",
              color: "var(--text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span className="muted" style={{ fontSize: 13 }}>
              Call us now
            </span>
            <span style={{ fontWeight: 600 }}>{company.phones[0].value}</span>
          </a>
        </m.div>
      </div>

      <style>{`
        @media (max-width: 920px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 44px !important; }
        }
      `}</style>
    </section>
  );
}
