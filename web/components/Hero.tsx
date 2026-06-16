import { company } from "@/lib/content";
import ContactForm from "./ContactForm";

export default function Hero() {
  return (
    <section
      id="top"
      style={{
        position: "relative",
        paddingTop: 150,
        paddingBottom: 90,
        overflow: "hidden",
      }}
    >
      {/* marble slab glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(700px 500px at 78% 30%, rgba(200,169,106,0.18), transparent 60%)",
          pointerEvents: "none",
        }}
      />
      <div
        className="container hero-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1.15fr 0.85fr",
          gap: 56,
          alignItems: "center",
          position: "relative",
        }}
      >
        <div>
          <span className="eyebrow">Crafting in stone since {company.founded}</span>
          <h1
            className="display"
            style={{
              fontSize: "clamp(44px, 7vw, 86px)",
              margin: "22px 0 0",
            }}
          >
            Natural stone
            <br />
            <span className="gold-text">in design.</span>
          </h1>
          <p
            className="muted"
            style={{
              maxWidth: 520,
              marginTop: 24,
              fontSize: 18,
              lineHeight: 1.65,
            }}
          >
            Bespoke interiors, fireplaces, hammams and saunas in marble, granite,
            onyx and quartzite — engineered and installed turnkey, from the first
            measurement to lifelong maintenance.
          </p>

          <div
            style={{
              display: "flex",
              gap: 14,
              marginTop: 34,
              flexWrap: "wrap",
            }}
          >
            <a href="#products" className="btn btn-primary">
              Explore our work
            </a>
            <a href="#contact" className="btn btn-ghost">
              Talk to a specialist
            </a>
          </div>

          <div
            style={{
              display: "flex",
              gap: 34,
              marginTop: 46,
              flexWrap: "wrap",
            }}
          >
            {[
              ["25+", "Years of craft"],
              ["A→Z", "Turnkey service"],
              ["100%", "Natural stone"],
            ].map(([v, l]) => (
              <div key={l}>
                <div
                  className="gold-text"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 30,
                    lineHeight: 1,
                  }}
                >
                  {v}
                </div>
                <div
                  className="muted"
                  style={{ fontSize: 13, marginTop: 6, letterSpacing: "0.02em" }}
                >
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="card hero-card"
          style={{ padding: 26, position: "relative" }}
        >
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>
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
        </div>
      </div>

      <style>{`
        @media (max-width: 920px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
    </section>
  );
}
