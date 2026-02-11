import "server-only";

import { cookies } from "next/headers";

import { defaultMessageForStatus } from "@/lib/httpStatus";

export class BackendFetchError extends Error {
  status: number;
  url: string;

  constructor(message: string, { status, url }: { status: number; url: string }) {
    super(message);
    this.name = "BackendFetchError";
    this.status = status;
    this.url = url;
  }
}

function backendOrigin() {
  return process.env.BACKEND_ORIGIN?.replace(/\/+$/, "") || "http://localhost:8000";
}

function internalApiKey() {
  return process.env.INTERNAL_API_KEY?.trim() || "";
}

type BackendFetchOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
  forwardCookies?: boolean;
  revalidate?: number;
};

function methodNeedsCsrf(method: string) {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
}

function detailFromJson(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === "string" && detail.trim()) return detail.trim();
  return null;
}

async function buildForwardHeaders({
  extra = {},
  forwardCookies = true
}: {
  extra?: Record<string, string>;
  forwardCookies?: boolean;
}) {
  const cookieStore = await cookies();
  const all = forwardCookies ? cookieStore.getAll() : [];
  const cookieHeader = all.length ? all.map(({ name, value }) => `${name}=${value}`).join("; ") : "";

  const internalKey = internalApiKey();
  const headers: Record<string, string> = {
    ...(cookieHeader ? { cookie: cookieHeader } : {}),
    ...(internalKey ? { "x-internal-api-key": internalKey } : {}),
    ...extra
  };

  const csrf = cookieStore.get("csrftoken")?.value;
  if (csrf && !("x-csrftoken" in headers) && !("X-CSRFToken" in headers)) headers["x-csrftoken"] = csrf;
  return headers;
}

export async function backendFetchJson<T>(
  path: string,
  options: BackendFetchOptions = {}
): Promise<T> {
  const url = `${backendOrigin()}${path.startsWith("/") ? "" : "/"}${path}`;
  const method = (options.method ?? "GET").toUpperCase();
  const forwardCookies = options.forwardCookies ?? true;
  const headers: Record<string, string> = await buildForwardHeaders({
    forwardCookies,
    extra: {
      accept: "application/json",
      ...(options.headers ?? {})
    }
  });

  if (!methodNeedsCsrf(method)) {
    delete headers["x-csrftoken"];
  }

  const cache =
    options.cache ??
    (methodNeedsCsrf(method) ? "no-store" : forwardCookies ? "no-store" : "force-cache");
  const nextConfig =
    !methodNeedsCsrf(method) && !forwardCookies
      ? { revalidate: options.revalidate ?? 3600 }
      : undefined;

  const res = await fetch(url, {
    ...options,
    method,
    headers,
    cache,
    ...(nextConfig ? ({ next: nextConfig } as unknown as RequestInit) : {})
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = (await res.json().catch(() => null)) as unknown;
      const detail = detailFromJson(body);
      if (!detail) {
        console.error("backendFetchJson non-OK JSON response", { url, status: res.status, body });
      }
      throw new BackendFetchError(detail || defaultMessageForStatus(res.status), { status: res.status, url });
    }
    const text = await res.text().catch(() => "");
    const preview = text.length > 500 ? `${text.slice(0, 500)}…` : text;
    console.error("backendFetchJson non-OK non-JSON response", {
      url,
      status: res.status,
      contentType,
      bodyPreview: preview
    });
    throw new BackendFetchError(defaultMessageForStatus(res.status), { status: res.status, url });
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function backendFetchForm<T>(
  path: string,
  form: FormData,
  options: BackendFetchOptions = {}
): Promise<T> {
  const url = `${backendOrigin()}${path.startsWith("/") ? "" : "/"}${path}`;
  const method = (options.method ?? "POST").toUpperCase();
  const forwardCookies = options.forwardCookies ?? true;
  const headers: Record<string, string> = await buildForwardHeaders({
    forwardCookies,
    extra: {
      accept: "application/json",
      ...(options.headers ?? {})
    }
  });

  if (!methodNeedsCsrf(method)) {
    delete headers["x-csrftoken"];
  }

  const res = await fetch(url, {
    ...options,
    method,
    body: form,
    headers,
    cache: "no-store"
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = (await res.json().catch(() => null)) as unknown;
      const detail = detailFromJson(body);
      if (!detail) {
        console.error("backendFetchForm non-OK JSON response", { url, status: res.status, body });
      }
      throw new BackendFetchError(detail || defaultMessageForStatus(res.status), { status: res.status, url });
    }
    const text = await res.text().catch(() => "");
    const preview = text.length > 500 ? `${text.slice(0, 500)}…` : text;
    console.error("backendFetchForm non-OK non-JSON response", {
      url,
      status: res.status,
      contentType,
      bodyPreview: preview
    });
    throw new BackendFetchError(defaultMessageForStatus(res.status), { status: res.status, url });
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
