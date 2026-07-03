"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

/** Persistent light/dark theme switch. Reads the initial theme from the
 *  data-theme attribute set by the no-flash script in the root layout. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const current = (document.documentElement.dataset.theme as Theme) || "dark";
    setTheme(current);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("sps_theme", next);
    } catch {
      // storage disabled — theme simply won't persist
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      title="Toggle theme"
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
        fontSize: 17,
        lineHeight: 1,
      }}
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
