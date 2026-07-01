"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ---------------- Types ---------------- */
type Item = { id: string; title: string; desc?: string; img: string };
type Content = {
  products: Item[];
  hamamGallery: Item[];
  saunaGallery: Item[];
};
type SectionKey = keyof Content;

type Bar = { key: string; count: number };
type Visit = {
  id: string;
  at: string;
  path: string;
  country: string;
  city: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  referrer: string;
  isNew: boolean;
  duration?: number;
};
type Stats = {
  online: number;
  visitorsToday: number;
  visitorsWeek: number;
  visitorsMonth: number;
  pageviewsToday: number;
  pageviewsTotal: number;
  avgTimeSeconds: number;
  topPages: Bar[];
  countries: Bar[];
  sources: Bar[];
  devices: Bar[];
  browsers: Bar[];
  recent: Visit[];
};
type LogEntry = {
  id: string;
  at: string;
  type: string;
  message: string;
  ip?: string;
};
type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
  lastLogin: string | null;
};

type Tab = "dashboard" | "analytics" | "photos" | "users" | "logs" | "settings";

const SECTIONS: { key: SectionKey; label: string; hasDesc: boolean }[] = [
  { key: "products", label: "Products", hasDesc: true },
  { key: "hamamGallery", label: "Hamam gallery", hasDesc: false },
  { key: "saunaGallery", label: "Sauna gallery", hasDesc: false },
];

const TABS: { key: Tab; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "analytics", label: "Analytics" },
  { key: "photos", label: "Photos" },
  { key: "users", label: "Users" },
  { key: "logs", label: "Logs" },
  { key: "settings", label: "Settings" },
];

/* ================================================================= */
export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<Tab>("dashboard");

  const [content, setContent] = useState<Content | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [telegramOn, setTelegramOn] = useState(false);
  const [usingDb, setUsingDb] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState("");

  const loadAnalytics = useCallback(async () => {
    const res = await fetch("/api/admin/analytics", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setStats(data.stats);
      setTelegramOn(!!data.telegramEnabled);
      setUsingDb(!!data.usingDatabase);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    const res = await fetch("/api/admin/logs", { cache: "no-store" });
    if (res.ok) setLogs((await res.json()).logs);
  }, []);

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    if (res.ok) setUsers((await res.json()).users);
  }, []);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/content", { cache: "no-store" });
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    setAuthed(true);
    setContent(await res.json());
    loadAnalytics();
    loadLogs();
    loadUsers();
  }, [loadAnalytics, loadLogs, loadUsers]);

  useEffect(() => {
    load();
  }, [load]);

  // Live-ish dashboard: refresh stats while viewing the dashboard/analytics.
  useEffect(() => {
    if (!authed) return;
    if (tab !== "dashboard" && tab !== "analytics") return;
    const id = setInterval(loadAnalytics, 20_000);
    return () => clearInterval(id);
  }, [authed, tab, loadAnalytics]);

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
    } else if (res.status === 429) {
      setLoginError("Too many attempts — wait a minute and try again.");
    } else {
      setLoginError("Wrong password — try again.");
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setContent(null);
    setStats(null);
    setLogs([]);
    setUsers([]);
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
      loadLogs();
    }
  }

  function update(section: SectionKey, items: Item[]) {
    setContent((c) => (c ? { ...c, [section]: items } : c));
  }

  if (authed === null) return <Centered>Loading…</Centered>;

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
            Enter the admin password to open the dashboard.
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
          <button className="btn btn-primary" style={{ width: "100%", marginTop: 16 }}>
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
          background: "var(--bg)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            minHeight: 68,
            flexWrap: "wrap",
            paddingTop: 10,
            paddingBottom: 10,
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
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {savedAt && (
              <span className="muted" style={{ fontSize: 12.5 }}>
                Saved {savedAt}
              </span>
            )}
            <a href="/" target="_blank" className="btn btn-ghost" style={{ padding: "9px 16px" }}>
              View site
            </a>
            {tab === "photos" && (
              <button
                onClick={save}
                className="btn btn-primary"
                disabled={saving}
                style={{ padding: "9px 20px", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            )}
            <button onClick={logout} className="btn btn-ghost" style={{ padding: "9px 16px" }}>
              Logout
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="container" style={{ display: "flex", gap: 4, overflowX: "auto" }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                background: "none",
                border: "none",
                borderBottom:
                  tab === t.key ? "2px solid var(--gold)" : "2px solid transparent",
                color: tab === t.key ? "var(--gold-soft)" : "var(--muted)",
                padding: "12px 14px",
                fontSize: 14.5,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="container" style={{ paddingTop: 32 }}>
        {tab === "dashboard" && <Dashboard stats={stats} logs={logs} />}
        {tab === "analytics" && <Analytics stats={stats} onRefresh={loadAnalytics} />}
        {tab === "photos" && content && (
          <>
            <h1 className="display" style={{ fontSize: 34, margin: "0 0 6px" }}>
              Manage photos
            </h1>
            <p className="muted" style={{ marginTop: 0, fontSize: 15 }}>
              Upload, edit, reorder and remove images. Click{" "}
              <strong style={{ color: "var(--gold-soft)" }}>Save changes</strong> to publish.
            </p>
            {SECTIONS.map((s) => (
              <PhotoSection
                key={s.key}
                label={s.label}
                hasDesc={s.hasDesc}
                items={content[s.key]}
                onChange={(items) => update(s.key, items)}
              />
            ))}
          </>
        )}
        {tab === "users" && <Users users={users} onReload={loadUsers} />}
        {tab === "logs" && <Logs logs={logs} onRefresh={loadLogs} />}
        {tab === "settings" && <Settings telegramOn={telegramOn} usingDb={usingDb} />}
      </main>
    </div>
  );
}

/* ---------------- Dashboard ---------------- */
function Dashboard({ stats, logs }: { stats: Stats | null; logs: LogEntry[] }) {
  if (!stats) return <p className="muted">Loading analytics…</p>;
  return (
    <>
      <h1 className="display" style={{ fontSize: 34, margin: "0 0 20px" }}>
        Dashboard
      </h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
          gap: 14,
        }}
      >
        <Stat label="Online now" value={stats.online} accent />
        <Stat label="Visitors today" value={stats.visitorsToday} />
        <Stat label="This week" value={stats.visitorsWeek} />
        <Stat label="This month" value={stats.visitorsMonth} />
        <Stat label="Pageviews today" value={stats.pageviewsToday} />
        <Stat label="Avg. time" value={formatDuration(stats.avgTimeSeconds)} />
      </div>

      <div
        style={{
          marginTop: 26,
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: 18,
          alignItems: "start",
        }}
        className="dash-grid"
      >
        <div className="card" style={{ padding: 22 }}>
          <h3 style={panelH}>Latest visits</h3>
          {stats.recent.length === 0 ? (
            <p className="muted" style={{ fontSize: 14 }}>No visits recorded yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "var(--faint)" }}>
                    <Th>Time</Th>
                    <Th>Location</Th>
                    <Th>Device</Th>
                    <Th>Page</Th>
                    <Th>Type</Th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent.slice(0, 12).map((v) => (
                    <tr key={v.id} style={{ borderTop: "1px solid var(--line)" }}>
                      <Td>{new Date(v.at).toLocaleTimeString()}</Td>
                      <Td>
                        {v.city && v.city !== "Unknown" ? `${v.city}, ` : ""}
                        {v.country}
                      </Td>
                      <Td>
                        {v.device} · {v.browser}
                      </Td>
                      <Td>{v.path}</Td>
                      <Td>
                        <span style={{ color: v.isNew ? "var(--gold-soft)" : "var(--muted)" }}>
                          {v.isNew ? "New" : "Return"}
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 22 }}>
          <h3 style={panelH}>Recent activity</h3>
          {logs.length === 0 ? (
            <p className="muted" style={{ fontSize: 14 }}>No activity yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
              {logs.slice(0, 10).map((l) => (
                <li key={l.id} style={{ fontSize: 13.5, display: "flex", gap: 10 }}>
                  <LogDot type={l.type} />
                  <span style={{ flex: 1 }}>{l.message}</span>
                  <span className="muted" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                    {new Date(l.at).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <style>{`@media(max-width:820px){.dash-grid{grid-template-columns:1fr !important}}`}</style>
    </>
  );
}

/* ---------------- Analytics ---------------- */
function Analytics({
  stats,
  onRefresh,
}: {
  stats: Stats | null;
  onRefresh: () => void;
}) {
  if (!stats) return <p className="muted">Loading analytics…</p>;
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h1 className="display" style={{ fontSize: 34, margin: 0 }}>
          Analytics
        </h1>
        <button className="btn btn-ghost" style={{ padding: "9px 16px" }} onClick={onRefresh}>
          Refresh
        </button>
      </div>
      <p className="muted" style={{ marginTop: -8, fontSize: 14 }}>
        {stats.pageviewsTotal} pageviews recorded in total.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: 18,
          marginTop: 20,
        }}
      >
        <BarPanel title="Popular pages" bars={stats.topPages} />
        <BarPanel title="Geography" bars={stats.countries} />
        <BarPanel title="Traffic sources" bars={stats.sources} />
        <BarPanel title="Devices" bars={stats.devices} />
        <BarPanel title="Browsers" bars={stats.browsers} />
      </div>
    </>
  );
}

function BarPanel({ title, bars }: { title: string; bars: Bar[] }) {
  const max = Math.max(1, ...bars.map((b) => b.count));
  return (
    <div className="card" style={{ padding: 22 }}>
      <h3 style={panelH}>{title}</h3>
      {bars.length === 0 ? (
        <p className="muted" style={{ fontSize: 14 }}>No data yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 4 }}>
          {bars.map((b) => (
            <div key={b.key}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13.5,
                  marginBottom: 5,
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>
                  {b.key}
                </span>
                <span className="muted">{b.count}</span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: "var(--panel)", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${(b.count / max) * 100}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: "linear-gradient(90deg, var(--gold-soft), var(--gold))",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Logs ---------------- */
function Logs({ logs, onRefresh }: { logs: LogEntry[]; onRefresh: () => void }) {
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h1 className="display" style={{ fontSize: 34, margin: 0 }}>
          Activity logs
        </h1>
        <button className="btn btn-ghost" style={{ padding: "9px 16px" }} onClick={onRefresh}>
          Refresh
        </button>
      </div>
      <div className="card" style={{ padding: 8 }}>
        {logs.length === 0 ? (
          <p className="muted" style={{ fontSize: 14, padding: 16 }}>No activity yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--faint)" }}>
                <Th>Time</Th>
                <Th>Type</Th>
                <Th>Message</Th>
                <Th>IP</Th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <Td>{new Date(l.at).toLocaleString()}</Td>
                  <Td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <LogDot type={l.type} /> {l.type}
                    </span>
                  </Td>
                  <Td>{l.message}</Td>
                  <Td className="muted">{l.ip || "—"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

/* ---------------- Users ---------------- */
function Users({ users, onReload }: { users: UserRow[]; onReload: () => void }) {
  async function setRole(id: string, role: "USER" | "ADMIN") {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    onReload();
  }
  async function remove(id: string) {
    if (!confirm("Delete this user?")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    onReload();
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 className="display" style={{ fontSize: 34, margin: 0 }}>
          Users <span className="muted" style={{ fontSize: 18 }}>({users.length})</span>
        </h1>
        <button className="btn btn-ghost" style={{ padding: "9px 16px" }} onClick={onReload}>
          Refresh
        </button>
      </div>
      <div className="card" style={{ padding: 8 }}>
        {users.length === 0 ? (
          <p className="muted" style={{ fontSize: 14, padding: 16 }}>
            No registered users yet. People who sign up at <code>/account</code> appear here.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--faint)" }}>
                <Th>Email</Th>
                <Th>Name</Th>
                <Th>Role</Th>
                <Th>Joined</Th>
                <Th>Last login</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <Td>{u.email}</Td>
                  <Td>{u.name || "—"}</Td>
                  <Td>
                    <span style={{ color: u.role === "ADMIN" ? "var(--gold-soft)" : "var(--muted)" }}>
                      {u.role}
                    </span>
                  </Td>
                  <Td>{new Date(u.createdAt).toLocaleDateString()}</Td>
                  <Td>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : "—"}</Td>
                  <Td>
                    <span style={{ display: "flex", gap: 6 }}>
                      <SmallBtn onClick={() => setRole(u.id, u.role === "ADMIN" ? "USER" : "ADMIN")}>
                        {u.role === "ADMIN" ? "Make user" : "Make admin"}
                      </SmallBtn>
                      <SmallBtn danger onClick={() => remove(u.id)}>
                        Delete
                      </SmallBtn>
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

/* ---------------- Settings ---------------- */
function Settings({ telegramOn, usingDb }: { telegramOn: boolean; usingDb: boolean }) {
  return (
    <>
      <h1 className="display" style={{ fontSize: 34, margin: "0 0 20px" }}>
        Settings
      </h1>
      <div style={{ display: "grid", gap: 16, maxWidth: 720 }}>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={panelH}>Storage</h3>
          <p className="muted" style={{ fontSize: 14, lineHeight: 1.6 }}>
            {usingDb ? (
              <>
                <Badge ok /> PostgreSQL via Prisma (<code>DATABASE_URL</code> is set).
              </>
            ) : (
              <>
                <Badge /> JSON / Vercel Blob. Set <code>DATABASE_URL</code> and run{" "}
                <code>prisma migrate deploy</code> to switch to PostgreSQL.
              </>
            )}
          </p>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={panelH}>Telegram notifications</h3>
          <p className="muted" style={{ fontSize: 14, lineHeight: 1.6 }}>
            {telegramOn ? (
              <>
                <Badge ok /> Connected. The bot sends alerts for visits, admin logins,
                contact leads and uploads.
              </>
            ) : (
              <>
                <Badge /> Not configured. Set <code>TELEGRAM_BOT_TOKEN</code> and{" "}
                <code>TELEGRAM_CHAT_ID</code> in your environment to enable alerts.
              </>
            )}
          </p>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={panelH}>Admin password</h3>
          <p className="muted" style={{ fontSize: 14, lineHeight: 1.6 }}>
            The admin password is set with the <code>ADMIN_PASSWORD</code> environment
            variable and the session cookie is signed with <code>ADMIN_SECRET</code>.
            Change these in your host&apos;s environment settings, then redeploy.
          </p>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={panelH}>Data &amp; backups</h3>
          <p className="muted" style={{ fontSize: 14, lineHeight: 1.6 }}>
            Content, visits and logs are stored as JSON (Vercel Blob in production,
            local files in development). To back up, download{" "}
            <code>content.json</code> and <code>analytics.json</code> from your Blob store.
          </p>
        </div>
      </div>
    </>
  );
}

/* ---------------- Photo management (from the original admin) ---------------- */
function PhotoSection({
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
    onChange([...items, { id: crypto.randomUUID(), title: "", desc: "", img: "" }]);
  }

  return (
    <section style={{ marginTop: 40 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, margin: 0 }}>
          {label} <span className="muted" style={{ fontSize: 15 }}>({items.length})</span>
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
      <div style={{ position: "relative", height: 170, background: "var(--panel)" }}>
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
            style={{ height: "100%", display: "grid", placeItems: "center", fontSize: 13 }}
          >
            No image yet
          </div>
        )}
        <button
          onClick={() => fileRef.current?.click()}
          className="btn btn-primary"
          style={{ position: "absolute", bottom: 10, right: 10, padding: "7px 14px", fontSize: 13 }}
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
            <SmallBtn disabled={isFirst} onClick={() => onMove(-1)}>↑</SmallBtn>
            <SmallBtn disabled={isLast} onClick={() => onMove(1)}>↓</SmallBtn>
          </div>
          <SmallBtn onClick={onRemove} danger>Delete</SmallBtn>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Small shared bits ---------------- */
function Stat({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className="card" style={{ padding: "20px 22px" }}>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 34,
          lineHeight: 1,
          color: accent ? undefined : "var(--text)",
        }}
        className={accent ? "gold-text" : undefined}
      >
        {value}
      </div>
      <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
        {label}
      </div>
    </div>
  );
}

function LogDot({ type }: { type: string }) {
  const color =
    type === "error"
      ? "#e07a5f"
      : type === "contact"
        ? "#4e8d8c"
        : type === "admin_login" || type === "admin_logout"
          ? "#c8a96a"
          : type === "upload" || type === "content_update"
            ? "#8a7fb0"
            : "#6c6a64";
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: color,
        flex: "0 0 auto",
        marginTop: 5,
      }}
    />
  );
}

function Badge({ ok }: { ok?: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        marginRight: 8,
        color: ok ? "#1a1305" : "var(--text)",
        background: ok ? "linear-gradient(120deg, var(--gold-soft), var(--gold))" : "var(--panel)",
        border: ok ? "none" : "1px solid var(--line-strong)",
      }}
    >
      {ok ? "Active" : "Off"}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: "8px 10px", fontWeight: 600, fontSize: 12 }}>{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={className} style={{ padding: "9px 10px" }}>
      {children}
    </td>
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
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      {children}
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (!seconds) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

const panelH: React.CSSProperties = {
  margin: "0 0 14px",
  fontFamily: "var(--font-display)",
  fontSize: 19,
  fontWeight: 400,
};
