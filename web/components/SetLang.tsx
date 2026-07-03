"use client";

import { useEffect } from "react";

/** Sets <html lang> for localized pages (the root layout renders lang="en"). */
export default function SetLang({ lang }: { lang: string }) {
  useEffect(() => {
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = "en";
    };
  }, [lang]);
  return null;
}
