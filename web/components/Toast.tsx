"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; message: string; kind: ToastKind };

const ToastCtx = createContext<(message: string, kind?: ToastKind) => void>(() => {});

/** Access the toast trigger: `const toast = useToast(); toast("Saved", "success")`. */
export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 100,
          display: "grid",
          gap: 10,
          maxWidth: "min(360px, calc(100vw - 40px))",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="card"
            style={{
              padding: "13px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 14.5,
              borderLeft: `3px solid ${
                t.kind === "success" ? "#5aa06a" : t.kind === "error" ? "#e07a5f" : "var(--gold)"
              }`,
              animation: "toast-in .25s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <span>
              {t.kind === "success" ? "✓" : t.kind === "error" ? "✕" : "•"}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes toast-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}`}</style>
    </ToastCtx.Provider>
  );
}
