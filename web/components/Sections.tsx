import Image from "next/image";
import Reveal from "./Reveal";
import ContactForm from "./ContactForm";
import {
  categories,
  design,
  stones,
  hamam,
  sauna,
  about,
  company,
} from "@/lib/content";
import type { Item } from "@/lib/store";

/* ---------- Marquee ---------- */
export function Marquee() {
  const items = [...categories, ...categories];
  return (
    <div className="marquee" aria-hidden>
      <div className="marquee__track">
        {items.map((c, i) => (
          <span className="marquee__item" key={i}>
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Design / services ---------- */
export function DesignSection() {
  return (
    <section id="design" className="section">
      <div className="container">
        <div
          className="design-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "0.9fr 1.1fr",
            gap: 56,
            alignItems: "center",
          }}
        >
          <Reveal>
            <span className="eyebrow">What we do</span>
            <h2 className="display section-title" style={{ marginTop: 16 }}>
              {design.title}
            </h2>
          </Reveal>
          <div style={{ display: "grid", gap: 18 }}>
            {design.points.map((p, i) => (
              <Reveal key={i} delay={i * 90}>
                <div
                  className="card"
                  style={{
                    padding: "22px 24px",
                    display: "flex",
                    gap: 18,
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    className="gold-text"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 24,
                      minWidth: 38,
                    }}
                  >
                    0{i + 1}
                  </span>
                  <p style={{ margin: 0, fontSize: 16.5, lineHeight: 1.6 }}>{p}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
      <style>{`@media (max-width:880px){.design-grid{grid-template-columns:1fr !important;gap:32px !important}}`}</style>
    </section>
  );
}

/* ---------- Stone palette ---------- */
export function Stones() {
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">The palette</span>
          <h2 className="display section-title">Stones we work with</h2>
          <p className="section-sub">
            A curated selection from quarries worldwide — each slab chosen for its
            character, then matched to your space.
          </p>
        </Reveal>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
            gap: 16,
          }}
        >
          {stones.map((s, i) => (
            <Reveal key={s.name} delay={i * 70}>
              <div className="card" style={{ overflow: "hidden" }}>
                <div
                  style={{
                    height: 150,
                    background: `radial-gradient(120px 80px at 30% 20%, ${s.accent}55, transparent 60%), radial-gradient(160px 120px at 80% 90%, ${s.accent}33, transparent 60%), ${s.color}`,
                    position: "relative",
                  }}
                >
                  <svg
                    style={{ position: "absolute", inset: 0, opacity: 0.35 }}
                    width="100%"
                    height="100%"
                  >
                    <path
                      d="M0 90 Q 60 40 140 80 T 320 70"
                      stroke={s.accent}
                      strokeWidth="1.2"
                      fill="none"
                    />
                    <path
                      d="M0 120 Q 90 100 180 130 T 340 110"
                      stroke={s.accent}
                      strokeWidth="0.8"
                      fill="none"
                      opacity="0.6"
                    />
                  </svg>
                </div>
                <div style={{ padding: "16px 18px" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 19 }}>
                    {s.name}
                  </div>
                  <div
                    className="muted"
                    style={{ fontSize: 12.5, marginTop: 5, lineHeight: 1.5 }}
                  >
                    {s.note}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Products ---------- */
export function Products({ items }: { items: Item[] }) {
  return (
    <section id="products" className="section" style={{ paddingTop: 0 }}>
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">Products & services</span>
          <h2 className="display section-title">Everything, crafted in stone</h2>
          <p className="section-sub">
            Natural-stone products of any style and complexity — designed,
            produced and installed by one team.
          </p>
        </Reveal>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
            gap: 18,
          }}
        >
          {items.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 70}>
              <article
                className="card"
                style={{ overflow: "hidden", height: "100%" }}
              >
                <div
                  style={{
                    position: "relative",
                    height: 190,
                    overflow: "hidden",
                  }}
                >
                  <Image
                    src={p.img}
                    alt={p.title}
                    fill
                    sizes="(max-width:600px) 100vw, 320px"
                    style={{ objectFit: "cover" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(180deg, transparent 40%, rgba(10,11,13,0.85))",
                    }}
                  />
                </div>
                <div style={{ padding: "18px 20px 22px" }}>
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-display)",
                      fontSize: 21,
                      fontWeight: 400,
                    }}
                  >
                    {p.title}
                  </h3>
                  <p
                    className="muted"
                    style={{ margin: "9px 0 0", fontSize: 14, lineHeight: 1.55 }}
                  >
                    {p.desc}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Hamam ---------- */
export function Hamam({ gallery }: { gallery: Item[] }) {
  return (
    <section
      id="hamam"
      className="section"
      style={{
        background:
          "linear-gradient(180deg, transparent, rgba(78,141,140,0.05), transparent)",
      }}
    >
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">{hamam.subheading}</span>
          <h2 className="display section-title">{hamam.heading}</h2>
        </Reveal>

        <div
          className="two-col"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}
        >
          <Reveal>
            <div className="card" style={{ padding: 28, height: "100%" }}>
              <h3 style={cardH}>{hamam.health.title}</h3>
              <p style={cardP}>{hamam.health.body}</p>
            </div>
          </Reveal>
          <Reveal delay={90}>
            <div className="card" style={{ padding: 28, height: "100%" }}>
              <h3 style={cardH}>{hamam.construction.title}</h3>
              <p style={cardP}>{hamam.construction.body}</p>
            </div>
          </Reveal>
        </div>

        <Reveal>
          <div style={{ marginTop: 40 }}>
            <span className="eyebrow">Portfolio</span>
          </div>
        </Reveal>
        <Gallery items={gallery} />

        <div style={{ marginTop: 18 }}>
          <Reveal>
            <div className="card" style={{ padding: 28 }}>
              <span className="eyebrow">Equipment</span>
              <ul style={listStyle}>
                {hamam.equipment.map((x) => (
                  <li key={x} style={listItem}>
                    <Dot /> {x}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
      <style>{`@media(max-width:820px){.two-col{grid-template-columns:1fr !important}}`}</style>
    </section>
  );
}

/* ---------- Reusable image gallery ---------- */
function Gallery({ items }: { items: Item[] }) {
  if (!items.length) return null;
  return (
    <div
      style={{
        marginTop: 16,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
        gap: 16,
      }}
    >
      {items.map((it, i) => (
        <Reveal key={it.id} delay={(i % 4) * 70}>
          <figure
            className="card"
            style={{
              margin: 0,
              overflow: "hidden",
              position: "relative",
              aspectRatio: "4 / 3",
            }}
          >
            <Image
              src={it.img}
              alt={it.title}
              fill
              sizes="(max-width:600px) 100vw, 300px"
              style={{ objectFit: "cover" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, transparent 45%, rgba(10,11,13,0.9))",
              }}
            />
            {it.title && (
              <figcaption
                style={{
                  position: "absolute",
                  left: 16,
                  bottom: 14,
                  right: 16,
                  fontFamily: "var(--font-display)",
                  fontSize: 17,
                }}
              >
                {it.title}
              </figcaption>
            )}
          </figure>
        </Reveal>
      ))}
    </div>
  );
}

/* ---------- Sauna ---------- */
export function Sauna({ gallery }: { gallery: Item[] }) {
  return (
    <section id="sauna" className="section" style={{ paddingTop: 0 }}>
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">{sauna.subheading}</span>
          <h2 className="display section-title" style={{ marginTop: 16 }}>
            {sauna.heading}
          </h2>
          <p className="section-sub">{sauna.body}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 26 }}>
            {sauna.services.map((s) => (
              <span
                key={s}
                style={{
                  border: "1px solid var(--line-strong)",
                  borderRadius: 999,
                  padding: "8px 16px",
                  fontSize: 13.5,
                  color: "var(--gold-soft)",
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal>
          <div style={{ marginTop: 8 }}>
            <span className="eyebrow">Portfolio</span>
          </div>
        </Reveal>
        <Gallery items={gallery} />
      </div>
    </section>
  );
}

/* ---------- About ---------- */
export function About() {
  return (
    <section id="about" className="section">
      <div className="container">
        <div
          className="design-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 56,
            alignItems: "center",
          }}
        >
          <Reveal>
            <span className="eyebrow">About the company</span>
            <h2 className="display section-title" style={{ marginTop: 16 }}>
              {about.title}
            </h2>
            <p className="section-sub">{about.body}</p>
            <div
              className="card"
              style={{
                marginTop: 28,
                padding: "18px 22px",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(120deg, var(--gold-soft), var(--gold))",
                  display: "grid",
                  placeItems: "center",
                  color: "#1a1305",
                  fontWeight: 700,
                }}
              >
                PR
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{company.guide.name}</div>
                <div className="muted" style={{ fontSize: 13 }}>
                  {company.guide.role}
                </div>
              </div>
              <a
                href={`https://wa.me/${company.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost"
                style={{ marginLeft: "auto", padding: "10px 16px" }}
              >
                WhatsApp
              </a>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              {about.stats.map((s) => (
                <div
                  key={s.label}
                  className="card"
                  style={{ padding: "30px 24px" }}
                >
                  <div
                    className="gold-text"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 40,
                      lineHeight: 1,
                    }}
                  >
                    {s.value}
                  </div>
                  <div className="muted" style={{ marginTop: 10, fontSize: 14 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- Contact ---------- */
export function Contact() {
  return (
    <section id="contact" className="section" style={{ paddingTop: 0 }}>
      <div className="container">
        <div
          className="card contact-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 0,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "clamp(28px,4vw,52px)" }}>
            <span className="eyebrow">Get in touch</span>
            <h2
              className="display"
              style={{ fontSize: "clamp(28px,3.6vw,44px)", margin: "16px 0 0" }}
            >
              Let&apos;s plan your project
            </h2>
            <p className="muted" style={{ marginTop: 16, fontSize: 16, lineHeight: 1.65, maxWidth: 460 }}>
              From measurements to turnkey installation and maintenance. Leave
              your number and {company.guide.name} will guide you through choosing
              your stone.
            </p>

            <div style={{ marginTop: 30, display: "grid", gap: 16 }}>
              <Info label="Address">
                <a href={company.mapsUrl} target="_blank" rel="noreferrer" style={linkStyle}>
                  {company.address}
                </a>
              </Info>
              <Info label="Phone">
                <div style={{ display: "grid", gap: 4 }}>
                  {company.phones.map((p) => (
                    <a key={p.value} href={p.href} style={linkStyle} target="_blank" rel="noreferrer">
                      {p.value}{" "}
                      <span className="muted" style={{ fontSize: 12 }}>
                        · {p.label}
                      </span>
                    </a>
                  ))}
                </div>
              </Info>
              <Info label="E-mail">
                <a href={`mailto:${company.email}`} style={linkStyle}>
                  {company.email}
                </a>
              </Info>
            </div>
          </div>

          <div
            style={{
              padding: "clamp(28px,4vw,52px)",
              background:
                "linear-gradient(180deg, rgba(200,169,106,0.08), rgba(255,255,255,0.02))",
              borderLeft: "1px solid var(--line)",
            }}
          >
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 16 }}>
              Submit a request
            </div>
            <ContactForm />
          </div>
        </div>
      </div>
      <style>{`@media(max-width:820px){.contact-grid{grid-template-columns:1fr !important}.contact-grid>div:last-child{border-left:none !important;border-top:1px solid var(--line)}}`}</style>
    </section>
  );
}

/* ---------- Footer ---------- */
export function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--line)",
        background: "rgba(255,255,255,0.015)",
        padding: "56px 0 40px",
      }}
    >
      <div
        className="container footer-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr",
          gap: 40,
        }}
      >
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 24 }}>
            {company.name}
          </div>
          <p className="muted" style={{ fontSize: 14, marginTop: 12, maxWidth: 320, lineHeight: 1.6 }}>
            {company.tagline}. {company.legalName} — bespoke natural stone since{" "}
            {company.founded}.
          </p>
        </div>
        <div>
          <FooterTitle>Explore</FooterTitle>
          {categories.map((c) => (
            <a key={c} href="#products" style={footerLink}>
              {c}
            </a>
          ))}
        </div>
        <div>
          <FooterTitle>Contact</FooterTitle>
          <a href={company.mapsUrl} target="_blank" rel="noreferrer" style={footerLink}>
            {company.address}
          </a>
          {company.phones.map((p) => (
            <a key={p.value} href={p.href} style={footerLink} target="_blank" rel="noreferrer">
              {p.value}
            </a>
          ))}
          <a href={`mailto:${company.email}`} style={footerLink}>
            {company.email}
          </a>
        </div>
      </div>
      <div className="container">
        <div className="hairline" style={{ margin: "36px 0 20px" }} />
        <div
          className="muted"
          style={{
            fontSize: 13,
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span>
            © {new Date().getFullYear()} {company.legalName}. All rights reserved.
          </span>
          <span>Natural stone in design.</span>
        </div>
      </div>
      <style>{`@media(max-width:760px){.footer-grid{grid-template-columns:1fr !important;gap:28px !important}}`}</style>
    </footer>
  );
}

/* ---------- small shared bits ---------- */
const cardH: React.CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-display)",
  fontSize: 23,
  fontWeight: 400,
};
const cardP: React.CSSProperties = {
  margin: "14px 0 0",
  color: "var(--muted)",
  fontSize: 15.5,
  lineHeight: 1.7,
};
const listStyle: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: "18px 0 0",
  display: "grid",
  gap: 12,
};
const listItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  fontSize: 15.5,
};
const linkStyle: React.CSSProperties = {
  color: "var(--text)",
  textDecoration: "none",
  fontSize: 15.5,
};
const footerLink: React.CSSProperties = {
  display: "block",
  color: "var(--muted)",
  textDecoration: "none",
  fontSize: 14,
  padding: "5px 0",
};

function Dot() {
  return (
    <span
      style={{
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: "linear-gradient(120deg, var(--gold-soft), var(--gold))",
        flex: "0 0 auto",
      }}
    />
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "var(--faint)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function FooterTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 12,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "var(--gold)",
        marginBottom: 14,
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}
