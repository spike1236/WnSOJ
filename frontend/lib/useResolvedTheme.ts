"use client";

import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

export function useResolvedTheme(mode: ThemeMode = "system"): "light" | "dark" {
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");

    const update = () => setSystemTheme(mql.matches ? "dark" : "light");
    update();

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", update);
      return () => mql.removeEventListener("change", update);
    }

    mql.addListener(update);
    return () => mql.removeListener(update);
  }, []);

  return mode === "system" ? systemTheme : mode;
}
