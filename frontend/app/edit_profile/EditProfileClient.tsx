"use client";

import type { UserDetail } from "@/lib/types";
import { csrfFetch } from "@/lib/csrf";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Notice = { tone: "success" | "error"; message: string } | null;

function errorToMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Request failed";
}

async function parseErrorResponse(res: Response) {
  function pickErrorMessage(value: unknown): string | null {
    if (typeof value === "string") return value.trim() ? value : null;
    if (Array.isArray(value)) {
      for (const v of value) {
        const msg = pickErrorMessage(v);
        if (msg) return msg;
      }
      return null;
    }
    if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      const detail = record.detail;
      if (typeof detail === "string" && detail.trim()) return detail;
      const message = record.message;
      if (typeof message === "string" && message.trim()) return message;
      for (const v of Object.values(record)) {
        const msg = pickErrorMessage(v);
        if (msg) return msg;
      }
    }
    return null;
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/html")) return `Request failed (${res.status}).`;
  if (contentType.includes("application/json")) {
    const body = (await res.json()) as unknown;
    const msg = pickErrorMessage(body);
    if (msg) return msg;
    return JSON.stringify(body);
  }
  const text = await res.text();
  if (/^\s*<!doctype html/i.test(text) || /<html[\s>]/i.test(text)) return `Request failed (${res.status}).`;
  return text;
}

export default function EditProfileClient({ user }: { user: UserDetail }) {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState<null | "profile" | "icon" | "password">(null);

  const profileHref = useMemo(() => `/profile/${encodeURIComponent(user.username)}`, [user.username]);

  async function handleUpdateIcon(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setBusy("icon");
    try {
      const form = event.currentTarget;
      const data = new FormData(form);
      const icon = data.get("icon");
      if (!(icon instanceof File) || icon.size === 0) {
        setNotice({ tone: "error", message: "Missing icon file." });
        return;
      }
      const payload = new FormData();
      payload.set("icon", icon);
      const res = await csrfFetch("/backend/profile/icon/", { method: "POST", body: payload });
      if (!res.ok) {
        setNotice({ tone: "error", message: await parseErrorResponse(res) });
        return;
      }
      setNotice({ tone: "success", message: "Profile picture updated." });
      form.reset();
      router.refresh();
    } catch (e) {
      setNotice({ tone: "error", message: errorToMessage(e) });
    } finally {
      setBusy(null);
    }
  }

  async function handleUpdateProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setBusy("profile");
    try {
      const form = event.currentTarget;
      const data = new FormData(form);
      const payload = {
        email: String(data.get("email") ?? "").trim(),
        first_name: String(data.get("first_name") ?? "").trim(),
        last_name: String(data.get("last_name") ?? "").trim(),
        phone_number: String(data.get("phone_number") ?? "").trim(),
        is_business: Boolean(data.get("is_business"))
      };
      const res = await csrfFetch("/backend/profile/", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        setNotice({ tone: "error", message: await parseErrorResponse(res) });
        return;
      }
      setNotice({ tone: "success", message: "Saved." });
      router.refresh();
    } catch (e) {
      setNotice({ tone: "error", message: errorToMessage(e) });
    } finally {
      setBusy(null);
    }
  }

  async function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setBusy("password");
    try {
      const form = event.currentTarget;
      const data = new FormData(form);
      const payload = {
        old_password: String(data.get("old_password") ?? ""),
        new_password1: String(data.get("new_password1") ?? ""),
        new_password2: String(data.get("new_password2") ?? "")
      };
      const res = await csrfFetch("/backend/profile/password/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        setNotice({ tone: "error", message: await parseErrorResponse(res) });
        return;
      }
      setNotice({ tone: "success", message: "Password updated." });
      form.reset();
      router.refresh();
    } catch (e) {
      setNotice({ tone: "error", message: errorToMessage(e) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <img
              alt={`${user.username}'s profile picture`}
              className="h-28 w-28 rounded-full border object-cover"
              src={user.icon170_url ?? "/img/favicon.svg"}
            />
            <div className="mt-3 text-xl font-semibold tracking-tight">{user.username}</div>
            <a className="mt-2 text-sm font-medium text-blue-600 hover:underline" href={profileHref}>
              View profile
            </a>
            <form className="mt-5 w-full max-w-sm" onSubmit={handleUpdateIcon}>
              <div className="grid gap-2">
                <label className="text-left text-sm font-medium text-slate-700" htmlFor="icon">
                  Profile picture
                </label>
                <input
                  className="h-11 rounded-lg border bg-white px-3 py-2 text-sm outline-none ring-blue-600 focus:ring-2"
                  disabled={busy === "icon"}
                  id="icon"
                  name="icon"
                  type="file"
                />
                <button
                  className="inline-flex h-11 items-center justify-center rounded-lg border px-4 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
                  disabled={busy === "icon"}
                  type="submit"
                >
                  Update Picture
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8">
        {notice ? (
          <div
            className={
              notice.tone === "success"
                ? "mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                : "mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            }
          >
            {notice.message}
          </div>
        ) : null}

        <div className="grid gap-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Account Details</h2>
            <form className="mt-4 grid gap-4" onSubmit={handleUpdateProfile}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-slate-700" htmlFor="first_name">
                    First name
                  </label>
                  <input
                    className="h-11 rounded-lg border px-3 text-sm outline-none ring-blue-600 focus:ring-2"
                    defaultValue={user.first_name ?? ""}
                    disabled={busy === "profile"}
                    id="first_name"
                    name="first_name"
                    type="text"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-slate-700" htmlFor="last_name">
                    Last name
                  </label>
                  <input
                    className="h-11 rounded-lg border px-3 text-sm outline-none ring-blue-600 focus:ring-2"
                    defaultValue={user.last_name ?? ""}
                    disabled={busy === "profile"}
                    id="last_name"
                    name="last_name"
                    type="text"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-slate-700" htmlFor="email">
                    Email
                  </label>
                  <input
                    className="h-11 rounded-lg border px-3 text-sm outline-none ring-blue-600 focus:ring-2"
                    defaultValue={user.email ?? ""}
                    disabled={busy === "profile"}
                    id="email"
                    name="email"
                    type="email"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-slate-700" htmlFor="phone_number">
                    Phone number
                  </label>
                  <input
                    className="h-11 rounded-lg border px-3 text-sm outline-none ring-blue-600 focus:ring-2"
                    defaultValue={user.phone_number ?? ""}
                    disabled={busy === "profile"}
                    id="phone_number"
                    name="phone_number"
                    type="text"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  className="h-4 w-4 rounded border"
                  defaultChecked={Boolean(user.is_business)}
                  disabled={busy === "profile"}
                  name="is_business"
                  type="checkbox"
                />
                Business account
              </label>

              <div className="flex justify-end">
                <button
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  disabled={busy === "profile"}
                  type="submit"
                >
                  Save
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Change Password</h2>
            <form className="mt-4 grid gap-4" onSubmit={handleChangePassword}>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-slate-700" htmlFor="old_password">
                  Old password
                </label>
                <input
                  className="h-11 rounded-lg border px-3 text-sm outline-none ring-blue-600 focus:ring-2"
                  disabled={busy === "password"}
                  id="old_password"
                  name="old_password"
                  required
                  type="password"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-slate-700" htmlFor="new_password1">
                    New password
                  </label>
                  <input
                    className="h-11 rounded-lg border px-3 text-sm outline-none ring-blue-600 focus:ring-2"
                    disabled={busy === "password"}
                    id="new_password1"
                    name="new_password1"
                    required
                    type="password"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-slate-700" htmlFor="new_password2">
                    Confirm new password
                  </label>
                  <input
                    className="h-11 rounded-lg border px-3 text-sm outline-none ring-blue-600 focus:ring-2"
                    disabled={busy === "password"}
                    id="new_password2"
                    name="new_password2"
                    required
                    type="password"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  className="inline-flex h-11 items-center justify-center rounded-lg border px-5 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
                  disabled={busy === "password"}
                  type="submit"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
