"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "ok" | "error";

export default function ContactForm({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<Status>("idle");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      if (!res.ok) throw new Error();
      setStatus("ok");
      setName("");
      setPhone("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <div
        className="card"
        style={{ padding: 24, textAlign: "center" }}
        role="status"
      >
        <div style={{ fontSize: 30, marginBottom: 6 }}>✓</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 20 }}>
          Thank you!
        </div>
        <p className="muted" style={{ margin: "8px 0 0", fontSize: 14.5 }}>
          We will contact you on WhatsApp shortly.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      style={{ display: "grid", gap: 12 }}
      aria-label="Contact request"
    >
      <input
        className="field"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        className="field"
        placeholder="Your phone number"
        value={phone}
        inputMode="tel"
        onChange={(e) => setPhone(e.target.value)}
        required
      />
      <button
        className="btn btn-primary"
        type="submit"
        disabled={status === "loading"}
        style={{ width: "100%", opacity: status === "loading" ? 0.7 : 1 }}
      >
        {status === "loading"
          ? "Sending…"
          : compact
            ? "Call me back"
            : "Submit a request"}
      </button>
      <p
        className="muted"
        style={{ margin: 0, fontSize: 12.5, textAlign: "center" }}
      >
        {status === "error"
          ? "Something went wrong — please call us instead."
          : "Leave your details and we'll contact you on WhatsApp."}
      </p>
    </form>
  );
}
