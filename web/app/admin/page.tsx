"use client";

import { useEffect, useRef, useState } from "react";

type Item = { id: string; title: string; desc?: string; img: string };
type Content = {
  products: Item[];
  hamamGallery: Item[];
  saunaGallery: Item[];
};
type SectionKey = keyof Content;

const SECTIONS: { key: SectionKey; label: string; hasDesc: boolean }[] = [
  { key: "products", label: "Products", hasDesc: true },
  { key: "hamamGallery", label: "Hamam gallery", hasDesc: false },
  { key: "saunaGallery", label: "Sauna gallery", hasDesc: false },
];

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [content, setContent] = useState<Content | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string>("");

  async function load() {
    const res = await fetch("/api/admin/content", { cache: "no-store" });
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    setAuthed(true);
    setContent(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setPassword("");
      load();
    } else {
      setLoginError("Wrong password — try again.");
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setContent(null);
  }

  async function save() {
    if (!content) return;
    setSaving(true);
    const res = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });
    setSaving(false);
    if (res.ok) {
      setContent(await res.json());
      setSavedAt(new Date().toLocaleTimeString());
    }
  }

  function update(section: SectionKey, items: Item[]) {
    setContent((c) => (c ? { ...c, [section]: items } : c));
  }

  if (authed === null) {
    return <Centered>Loading…</Centered>;
  }

  if (!authed) {
    return (
      <Centered>
        <form
          onSubmit={login}
          className="card"
          style={{ padding: 32, width: 360, maxWidth: "90vw" }}
        >
          <div style={{ fontFamily: "var(--font-display)", fontSize: 26 }}>
            Admin access
          </div>
          <p className="muted" style={{ fontSize: 14, margin: "8px 0 20px" }}>
            Enter the admin password to manage photos.
          </p>
          <input
            className="field"
            type="password"
            placeholder="Password"
            value={password}
            autoFocus
            onChange={(e) => setPassword(e.target.value)}
          />
          {loginError && (
            <p style={{ color: "#e98", fontSize: 13, margin: "10px 0 0" }}>
              {loginError}
            </p>
          )}
          <button
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 16 }}
          >
            Sign in
          </button>
        </form>
      </Centered>
    );
  }

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 120 }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "rgba(10,11,13,0.8)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 68,
          }}
        >
          <div>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 20 }}>
              Starpass Stone
            </span>
            <span
              className="muted"
              style={{ marginLeft: 12, fontSize: 13, letterSpacing: "0.2em" }}
            >
              ADMIN
            </span>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {savedAt && (
              <span className="muted" style={{ fontSize: 12.5 }}>
                Saved {savedAt}
              </span>
            )}
            <a
              href="/"
              target="_blank"
              className="btn btn-ghost"
              style={{ padding: "9px 16px" }}
            >
              View site
            </a>
            <button
              onClick={save}
              className="btn btn-primary"
              disabled={saving}
              style={{ padding: "9px 20px", opacity: saving ? 0.7 : 1 }}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              onClick={logout}
              className="btn btn-ghost"
              style={{ padding: "9px 16px" }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: 36 }}>
        <h1 className="display" style={{ fontSize: 38, margin: "0 0 6px" }}>
          Manage photos
        </h1>
        <p className="muted" style={{ marginTop: 0, fontSize: 15 }}>
          Upload, edit, reorder and remove images. Click{" "}
          <strong style={{ color: "var(--gold-soft)" }}>Save changes</strong> to
          publish them to the live site.
        </p>

        {content &&
          SECTIONS.map((s) => (
            <Section
              key={s.key}
              label={s.label}
              hasDesc={s.hasDesc}
              items={content[s.key]}
              onChange={(items) => update(s.key, items)}
            />
          ))}
      </main>
    </div>
  );
}

function Section({
  label,
  hasDesc,
  items,
  onChange,
}: {
  label: string;
  hasDesc: boolean;
  items: Item[];
  onChange: (items: Item[]) => void;
}) {
  function set(id: string, patch: Partial<Item>) {
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }
  function remove(id: string) {
    onChange(items.filter((it) => it.id !== id));
  }
  function move(id: string, dir: -1 | 1) {
    const i = items.findIndex((it) => it.id === id);
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  function add() {
    onChange([
      ...items,
      { id: crypto.randomUUID(), title: "", desc: "", img: "" },
    ]);
  }

  return (
    <section style={{ marginTop: 44 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 24,
            margin: 0,
          }}
        >
          {label}{" "}
          <span className="muted" style={{ fontSize: 15 }}>
            ({items.length})
          </span>
        </h2>
        <button className="btn btn-ghost" style={{ padding: "9px 16px" }} onClick={add}>
          + Add photo
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
          gap: 16,
        }}
      >
        {items.map((it, idx) => (
          <ItemCard
            key={it.id}
            item={it}
            hasDesc={hasDesc}
            isFirst={idx === 0}
            isLast={idx === items.length - 1}
            onSet={(p) => set(it.id, p)}
            onRemove={() => remove(it.id)}
            onMove={(d) => move(it.id, d)}
          />
        ))}
      </div>
    </section>
  );
}

function ItemCard({
  item,
  hasDesc,
  isFirst,
  isLast,
  onSet,
  onRemove,
  onMove,
}: {
  item: Item;
  hasDesc: boolean;
  isFirst: boolean;
  isLast: boolean;
  onSet: (p: Partial<Item>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setError("");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) {
      const { url } = await res.json();
      onSet({ img: url });
    } else {
      const { error } = await res.json().catch(() => ({ error: "Upload failed" }));
      setError(error || "Upload failed");
    }
  }

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div
        style={{
          position: "relative",
          height: 170,
          background: "rgba(255,255,255,0.03)",
        }}
      >
        {item.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.img}
            alt={item.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            className="muted"
            style={{
              height: "100%",
              display: "grid",
              placeItems: "center",
              fontSize: 13,
            }}
          >
            No image yet
          </div>
        )}
        <button
          onClick={() => fileRef.current?.click()}
          className="btn btn-primary"
          style={{
            position: "absolute",
            bottom: 10,
            right: 10,
            padding: "7px 14px",
            fontSize: 13,
          }}
          disabled={uploading}
        >
          {uploading ? "Uploading…" : item.img ? "Replace" : "Upload"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
      </div>

      <div style={{ padding: 14, display: "grid", gap: 9 }}>
        <input
          className="field"
          placeholder="Title"
          value={item.title}
          onChange={(e) => onSet({ title: e.target.value })}
        />
        {hasDesc && (
          <textarea
            className="field"
            placeholder="Description"
            rows={2}
            value={item.desc ?? ""}
            style={{ resize: "vertical", fontFamily: "inherit" }}
            onChange={(e) => onSet({ desc: e.target.value })}
          />
        )}
        {error && <span style={{ color: "#e98", fontSize: 12 }}>{error}</span>}
        <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <SmallBtn disabled={isFirst} onClick={() => onMove(-1)}>
              ↑
            </SmallBtn>
            <SmallBtn disabled={isLast} onClick={() => onMove(1)}>
              ↓
            </SmallBtn>
          </div>
          <SmallBtn onClick={onRemove} danger>
            Delete
          </SmallBtn>
        </div>
      </div>
    </div>
  );
}

function SmallBtn({
  children,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: "var(--panel)",
        border: "1px solid var(--line-strong)",
        color: danger ? "#e98" : "var(--text)",
        borderRadius: 9,
        padding: "7px 12px",
        fontSize: 13,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      {children}
    </div>
  );
}
