"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { Item } from "@/lib/store";

const CATEGORIES: { tag: string; label: string }[] = [
  { tag: "all", label: "All" },
  { tag: "design", label: "Design" },
  { tag: "products", label: "Products" },
  { tag: "fireplaces", label: "Fireplaces" },
  { tag: "hammam", label: "Hammams" },
  { tag: "sauna", label: "Saunas" },
  { tag: "production", label: "Production" },
];

const INITIAL_COUNT = 18;

/** The full photo archive with category filter chips and lazy "show more". */
export default function PortfolioGallery({ items }: { items: Item[] }) {
  const [tag, setTag] = useState("all");
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(
    () => (tag === "all" ? items : items.filter((it) => it.tag === tag)),
    [items, tag]
  );
  const visible = expanded ? filtered : filtered.slice(0, INITIAL_COUNT);

  // Only show chips for categories that actually have photos.
  const chips = CATEGORIES.filter(
    (c) => c.tag === "all" || items.some((it) => it.tag === c.tag)
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {chips.map((c) => {
          const active = tag === c.tag;
          const count =
            c.tag === "all" ? items.length : items.filter((it) => it.tag === c.tag).length;
          return (
            <button
              key={c.tag}
              onClick={() => {
                setTag(c.tag);
                setExpanded(false);
              }}
              style={{
                border: `1px solid ${active ? "var(--gold)" : "var(--line-strong)"}`,
                background: active ? "rgba(201,168,106,0.12)" : "var(--panel)",
                color: active ? "var(--gold-soft)" : "var(--muted)",
                borderRadius: 999,
                padding: "9px 18px",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all .2s ease",
              }}
            >
              {c.label} <span style={{ opacity: 0.6, fontWeight: 400 }}>{count}</span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
          gap: 12,
        }}
      >
        {visible.map((it, i) => (
          <figure
            key={it.id}
            className="card"
            style={{
              margin: 0,
              overflow: "hidden",
              position: "relative",
              aspectRatio: "1 / 1",
              animation: "gallery-in .45s cubic-bezier(0.16,1,0.3,1) both",
              animationDelay: `${Math.min(i % INITIAL_COUNT, 12) * 35}ms`,
            }}
          >
            <Image
              src={it.img}
              alt={it.title || `Starpass Stone — ${it.tag || "portfolio"} work in natural stone`}
              fill
              sizes="(max-width:600px) 50vw, 240px"
              style={{ objectFit: "cover" }}
              loading="lazy"
            />
            {it.title && (
              <figcaption
                style={{
                  position: "absolute",
                  left: 12,
                  bottom: 10,
                  right: 12,
                  fontSize: 13.5,
                  color: "#f0efe9",
                  textShadow: "0 1px 8px rgba(0,0,0,0.8)",
                }}
              >
                {it.title}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {filtered.length > INITIAL_COUNT && !expanded && (
        <div style={{ textAlign: "center", marginTop: 28 }}>
          <button className="btn btn-ghost" onClick={() => setExpanded(true)}>
            Show all {filtered.length} photos
          </button>
        </div>
      )}

      <style>{`@keyframes gallery-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
