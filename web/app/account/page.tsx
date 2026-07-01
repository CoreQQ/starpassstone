"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { useToast } from "@/components/Toast";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
  lastLogin: string | null;
};

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload =
      mode === "login" ? { email, password } : { email, name, password };
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setUser(data.user);
      setPassword("");
      toast(mode === "login" ? "Welcome back!" : "Account created — you're in.", "success");
    } else {
      toast(data.error || "Something went wrong.", "error");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    toast("Signed out.", "success");
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <TopBar />
      <main
        className="container"
        style={{ paddingTop: 120, paddingBottom: 80, maxWidth: 520 }}
      >
        <nav className="muted" style={{ fontSize: 13, marginBottom: 20 }}>
          <Link href="/" style={{ color: "var(--muted)", textDecoration: "none" }}>
            Home
          </Link>{" "}
          / <span style={{ color: "var(--text)" }}>Account</span>
        </nav>

        {!ready ? (
          <p className="muted">Loading…</p>
        ) : user ? (
          <div className="card" style={{ padding: 32 }}>
            <span className="eyebrow">Signed in</span>
            <h1 className="display" style={{ fontSize: 34, margin: "14px 0 20px" }}>
              {user.name || "Your account"}
            </h1>
            <div style={{ display: "grid", gap: 12, fontSize: 15 }}>
              <Row label="Email" value={user.email} />
              <Row label="Role" value={user.role} />
              <Row label="Member since" value={new Date(user.createdAt).toLocaleDateString()} />
              {user.lastLogin && (
                <Row label="Last login" value={new Date(user.lastLogin).toLocaleString()} />
              )}
            </div>
            <button
              className="btn btn-ghost"
              style={{ marginTop: 26, width: "100%" }}
              onClick={logout}
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="card" style={{ padding: 32 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
              <Tab active={mode === "login"} onClick={() => setMode("login")}>
                Sign in
              </Tab>
              <Tab active={mode === "register"} onClick={() => setMode("register")}>
                Create account
              </Tab>
            </div>
            <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
              {mode === "register" && (
                <input
                  className="field"
                  placeholder="Name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              )}
              <input
                className="field"
                type="email"
                placeholder="Email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="field"
                type="password"
                placeholder={mode === "register" ? "Password (min 8 chars)" : "Password"}
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
              />
              <button className="btn btn-primary" disabled={busy} style={{ opacity: busy ? 0.7 : 1 }}>
                {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

function TopBar() {
  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
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
          height: 68,
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 20,
            color: "var(--text)",
            textDecoration: "none",
          }}
        >
          Starpass Stone
        </Link>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <ThemeToggle />
          <Link href="/" className="btn btn-ghost" style={{ padding: "9px 16px" }}>
            Back to site
          </Link>
        </div>
      </div>
    </header>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
      <span className="muted">{label}</span>
      <span style={{ textAlign: "right" }}>{value}</span>
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        flex: 1,
        padding: "10px 0",
        borderRadius: 10,
        border: "1px solid var(--line-strong)",
        background: active ? "var(--panel)" : "transparent",
        color: active ? "var(--gold-soft)" : "var(--muted)",
        fontWeight: 600,
        fontSize: 14,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
