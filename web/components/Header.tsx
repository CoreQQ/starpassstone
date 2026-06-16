"use client";

import { useEffect, useState } from "react";
import { company, nav } from "@/lib/content";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: "all .3s ease",
        background: scrolled ? "rgba(10,11,13,0.72)" : "transparent",
        backdropFilter: scrolled ? "blur(14px)" : "none",
        borderBottom: scrolled
          ? "1px solid var(--line)"
          : "1px solid transparent",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 72,
        }}
      >
        <a
          href="#top"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            textDecoration: "none",
          }}
        >
          <Logo />
          <span style={{ lineHeight: 1 }}>
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-display)",
                fontSize: 19,
                letterSpacing: "0.02em",
                color: "var(--text)",
              }}
            >
              Starpass Stone
            </span>
            <span
              style={{
                display: "block",
                fontSize: 10,
                letterSpacing: "0.34em",
                textTransform: "uppercase",
                color: "var(--gold)",
                marginTop: 3,
              }}
            >
              Est. {company.founded}
            </span>
          </span>
        </a>

        <nav className="desktop-nav" style={{ display: "flex", gap: 30 }}>
          {nav.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              style={{
                color: "var(--muted)",
                textDecoration: "none",
                fontSize: 14.5,
                fontWeight: 500,
                transition: "color .2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--gold-soft)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <a
            href={`https://wa.me/${company.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary header-cta"
            style={{ padding: "10px 20px", fontSize: 14 }}
          >
            Get a quote
          </a>
          <button
            aria-label="Menu"
            className="burger"
            onClick={() => setOpen((v) => !v)}
            style={{
              display: "none",
              background: "var(--panel)",
              border: "1px solid var(--line-strong)",
              borderRadius: 10,
              width: 42,
              height: 42,
              color: "var(--text)",
              cursor: "pointer",
            }}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {open && (
        <div
          style={{
            background: "rgba(10,11,13,0.96)",
            borderTop: "1px solid var(--line)",
            padding: "14px 0 22px",
          }}
        >
          <div
            className="container"
            style={{ display: "flex", flexDirection: "column", gap: 6 }}
          >
            {nav.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                onClick={() => setOpen(false)}
                style={{
                  color: "var(--text)",
                  textDecoration: "none",
                  padding: "12px 4px",
                  borderBottom: "1px solid var(--line)",
                  fontSize: 16,
                }}
              >
                {n.label}
              </a>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .burger { display: inline-flex !important; align-items:center; justify-content:center; }
          .header-cta { display:none !important; }
        }
      `}</style>
    </header>
  );
}

function Logo() {
  return (
    <svg width="38" height="38" viewBox="0 0 48 48" fill="none" aria-hidden>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="48" y2="48">
          <stop stopColor="#e3cb96" />
          <stop offset="1" stopColor="#9c8350" />
        </linearGradient>
      </defs>
      <path
        d="M24 3l5.6 12.4L43 17.2l-9.8 9.1L35.8 40 24 33.2 12.2 40l2.6-13.7L5 17.2l13.4-1.8L24 3z"
        stroke="url(#lg)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="23" r="4.2" fill="url(#lg)" />
    </svg>
  );
}
