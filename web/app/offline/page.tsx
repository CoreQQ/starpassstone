import Link from "next/link";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div className="card" style={{ padding: 40, maxWidth: 460, textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 30 }}>You&apos;re offline</div>
        <p className="muted" style={{ marginTop: 12, fontSize: 15, lineHeight: 1.6 }}>
          It looks like you&apos;ve lost your connection. Starpass Stone will be right
          here when you&apos;re back online.
        </p>
        <Link href="/" className="btn btn-primary" style={{ marginTop: 24 }}>
          Try again
        </Link>
      </div>
    </div>
  );
}
