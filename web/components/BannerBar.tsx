"use client";

import { useEffect, useState } from "react";
import type { Banner } from "@/lib/repo";

/** Announcement bar at the very top of the site. Rotates active banners
 *  managed in the admin panel; dismissible for the session. */
export default function BannerBar({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("sps_banner_hidden") === "1") setHidden(true);
    } catch {
      // storage disabled — banner stays visible
    }
  }, []);

  useEffect(() => {
    if (banners.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % banners.length), 6000);
    return () => clearInterval(id);
  }, [banners.length]);

  if (hidden || banners.length === 0) return null;
  const b = banners[index % banners.length];

  return (
    <div className="banner-bar" role="status">
      {b.href ? (
        <a href={b.href} target={b.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
          {b.text}
        </a>
      ) : (
        <span>{b.text}</span>
      )}
      <button
        aria-label="Dismiss announcement"
        onClick={() => {
          setHidden(true);
          try {
            sessionStorage.setItem("sps_banner_hidden", "1");
          } catch {
            // ignore
          }
        }}
        style={{
          position: "absolute",
          right: 10,
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          color: "var(--muted)",
          cursor: "pointer",
          fontSize: 15,
          lineHeight: 1,
          padding: 6,
        }}
      >
        ✕
      </button>
    </div>
  );
}
