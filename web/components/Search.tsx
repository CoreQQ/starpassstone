"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  categories,
  design,
  stones,
  products,
  hamam,
  sauna,
  about,
  company,
} from "@/lib/content";

type Entry = { title: string; sub: string; anchor: string; keywords: string };

// Build a lightweight, in-memory search index from the site copy. Runs entirely
// client-side (no network), so results are instant.
function buildIndex(): Entry[] {
  const e: Entry[] = [];
  const add = (title: string, sub: string, anchor: string, extra = "") =>
    e.push({ title, sub, anchor, keywords: `${title} ${sub} ${extra}`.toLowerCase() });

  add(design.title, "Design & construction", "design", design.points.join(" "));
  categories.forEach((c) => add(c, "Category", "products"));
  products.forEach((p) => add(p.title, p.desc, "products"));
  stones.forEach((s) => add(s.name, s.note, "products", "stone marble palette"));
  add(hamam.heading, hamam.health.title, "hamam", hamam.health.body);
  add(hamam.construction.title, "Hammam", "hamam", hamam.construction.body);
  hamam.equipment.forEach((x) => add(x, "Hammam equipment", "hamam"));
  add(sauna.heading, sauna.subheading, "sauna", sauna.body);
  sauna.services.forEach((s) => add(s, "Sauna", "sauna"));
  add(about.title, "About the company", "about", about.body);
  add("Contact", `${company.address} · ${company.email}`, "contact", company.phones.map((p) => p.value).join(" "));
  return e;
}

export default function Search() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const index = useMemo(buildIndex, []);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return index.slice(0, 6);
    return index.filter((e) => e.keywords.includes(term)).slice(0, 12);
  }, [q, index]);

  // Keyboard: Cmd/Ctrl+K or "/" opens, Esc closes.
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if ((ev.key === "k" && (ev.metaKey || ev.ctrlKey)) || (ev.key === "/" && !open)) {
        const el = document.activeElement;
        const typing = el && ["INPUT", "TEXTAREA"].includes(el.tagName);
        if (!typing) {
          ev.preventDefault();
          setOpen(true);
        }
      }
      if (ev.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else setQ("");
  }, [open]);

  function go(anchor: string) {
    setOpen(false);
    if (location.pathname !== "/") {
      location.href = `/#${anchor}`;
      return;
    }
    document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Search"
        title="Search (⌘K)"
        style={{
          background: "var(--panel)",
          border: "1px solid var(--line-strong)",
          borderRadius: 10,
          width: 42,
          height: 42,
          color: "var(--text)",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
        }}
      >
        ⌕
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            padding: "12vh 20px 20px",
          }}
        >
          <div
            className="card"
            onClick={(ev) => ev.stopPropagation()}
            style={{ width: 560, maxWidth: "100%", padding: 0, overflow: "hidden" }}
          >
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products, hammams, saunas, stones…"
              style={{
                width: "100%",
                padding: "18px 20px",
                background: "transparent",
                border: "none",
                borderBottom: "1px solid var(--line)",
                color: "var(--text)",
                fontSize: 17,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
              {results.length === 0 ? (
                <div className="muted" style={{ padding: 22, fontSize: 14 }}>
                  No matches for “{q}”.
                </div>
              ) : (
                results.map((r, i) => (
                  <button
                    key={`${r.title}-${i}`}
                    onClick={() => go(r.anchor)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "13px 20px",
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px solid var(--line)",
                      cursor: "pointer",
                      color: "var(--text)",
                    }}
                    onMouseEnter={(ev) => (ev.currentTarget.style.background = "var(--panel)")}
                    onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{r.title}</div>
                    <div
                      className="muted"
                      style={{
                        fontSize: 12.5,
                        marginTop: 3,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.sub}
                    </div>
                  </button>
                ))
              )}
            </div>
            <div
              className="muted"
              style={{ padding: "10px 20px", fontSize: 12, display: "flex", gap: 14 }}
            >
              <span>↵ open</span>
              <span>esc close</span>
              <span>⌘K search</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
