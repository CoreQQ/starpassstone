"use client";

import { useEffect } from "react";

const VISITOR_KEY = "sps_visitor_id";

/**
 * Client-side page-visit tracker.
 * Fires a "view" event on mount (with a persisted visitor id so the server can
 * tell new from returning visitors) and an "end" beacon on unload carrying the
 * time spent on the page. All failures are silent — tracking never affects UX.
 */
export default function Tracker() {
  useEffect(() => {
    let visitorId = "";
    let isNew = false;
    try {
      visitorId = localStorage.getItem(VISITOR_KEY) || "";
      if (!visitorId) {
        visitorId =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem(VISITOR_KEY, visitorId);
        isNew = true;
      }
    } catch {
      // Private mode / storage disabled — fall back to a per-session id.
      visitorId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      isNew = true;
    }

    const start = Date.now();

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        type: "view",
        visitorId,
        isNew,
        path: location.pathname,
        referrer: document.referrer,
        language: navigator.language,
      }),
    }).catch(() => {});

    const sendEnd = () => {
      const duration = Math.round((Date.now() - start) / 1000);
      const payload = JSON.stringify({ type: "end", visitorId, duration });
      try {
        navigator.sendBeacon?.("/api/track", new Blob([payload], { type: "application/json" }));
      } catch {
        // ignore
      }
    };

    const onHide = () => {
      if (document.visibilityState === "hidden") sendEnd();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", sendEnd);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", sendEnd);
    };
  }, []);

  return null;
}
