import "server-only";

import { cookies } from "next/headers";

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
      const body = (await res.json()) as unknown;
      throw new Error(JSON.stringify({ status: res.status, body }));
    }
    const text = await res.text();
    throw new Error(JSON.stringify({ status: res.status, body: text }));
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
      const body = (await res.json()) as unknown;
      throw new Error(JSON.stringify({ status: res.status, body }));
    }
    const text = await res.text();
    throw new Error(JSON.stringify({ status: res.status, body: text }));
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
