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

export async function ensureCsrf() {
  await fetch("/backend/csrf/", { credentials: "include", cache: "no-store" });
}

export async function csrfFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    let token = getCookie("csrftoken");
    if (!token) {
      await ensureCsrf();
      token = getCookie("csrftoken");
    }
    if (token && !headers.has("X-CSRFToken")) headers.set("X-CSRFToken", token);
    if (!headers.has("Accept")) headers.set("Accept", "application/json");
  }

  return fetch(input, { ...init, method, headers, credentials: "include", cache: "no-store" });
}
