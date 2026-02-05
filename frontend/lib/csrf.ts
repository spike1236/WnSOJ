"use client";

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (!part) continue;
    const eq = part.indexOf("=");
    const k = eq === -1 ? part : part.slice(0, eq);
    if (k !== name) continue;
    const v = eq === -1 ? "" : part.slice(eq + 1);
    return decodeURIComponent(v);
  }
  return null;
}

let csrfBootstrapPromise: Promise<string> | null = null;

export async function ensureCsrf(): Promise<string> {
  const existing = getCookie("csrftoken");
  if (existing) return existing;

  if (!csrfBootstrapPromise) {
    csrfBootstrapPromise = (async () => {
      await fetch("/backend/csrf/", { credentials: "include", cache: "no-store" });
      const token = getCookie("csrftoken");
      if (!token) throw new Error("CSRF cookie was not set.");
      return token;
    })().finally(() => {
      csrfBootstrapPromise = null;
    });
  }

  return csrfBootstrapPromise;
}

export async function csrfFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const token = await ensureCsrf();
    if (token && !headers.has("X-CSRFToken")) headers.set("X-CSRFToken", token);
    if (!headers.has("Accept")) headers.set("Accept", "application/json");
  }

  return fetch(input, { ...init, method, headers, credentials: "include", cache: "no-store" });
}
