"use client";

import { csrfFetch } from "@/lib/csrf";
import { useRouter } from "next/navigation";
import { useState } from "react";

async function parseErrorResponse(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/html")) return `Request failed (${res.status}).`;
  if (contentType.includes("application/json")) {
    const body = (await res.json()) as unknown;
    if (body && typeof body === "object") {
      const detail = (body as { detail?: unknown }).detail;
      if (typeof detail === "string" && detail.trim()) return detail;
    }
    return JSON.stringify(body);
  }
  const text = await res.text();
  if (/^\s*<!doctype html/i.test(text) || /<html[\s>]/i.test(text)) return `Request failed (${res.status}).`;
  return text;
}

export default function LoginForm({ initialError }: { initialError?: string | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const data = new FormData(event.currentTarget);
      const username = String(data.get("username") ?? "").trim();
      const password = String(data.get("password") ?? "");
      const res = await csrfFetch("/backend/session/login/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        setError(await parseErrorResponse(res));
        return;
      }
      router.push("/home");
      router.refresh();
    } catch {
      setError("Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}
      <form className="grid gap-4" onSubmit={onSubmit}>
        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="username">
            Username
          </label>
          <input
            className="h-11 rounded-lg border px-3 text-sm outline-none ring-blue-600 focus:ring-2"
            disabled={busy}
            id="username"
            name="username"
            required
            type="text"
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="password">
            Password
          </label>
          <input
            className="h-11 rounded-lg border px-3 text-sm outline-none ring-blue-600 focus:ring-2"
            disabled={busy}
            id="password"
            name="password"
            required
            type="password"
          />
        </div>
        <button
          className="mt-2 inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          disabled={busy}
          type="submit"
        >
          Login
        </button>
      </form>
    </>
  );
}
