import "server-only";

import { cookies, headers as nextHeaders } from "next/headers";

import { defaultMessageForStatus } from "@/lib/httpStatus";
import { logError, logInfo, logWarning, normalizeRequestId } from "@/lib/logger.server";

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
  const incomingHeaders = await nextHeaders();
  const all = forwardCookies ? cookieStore.getAll() : [];
  const cookieHeader = all.length ? all.map(({ name, value }) => `${name}=${value}`).join("; ") : "";

  const internalKey = internalApiKey();
  const requestId = normalizeRequestId(incomingHeaders.get("x-request-id"));
  const headers: Record<string, string> = {
    ...(cookieHeader ? { cookie: cookieHeader } : {}),
    ...(internalKey ? { "x-internal-api-key": internalKey } : {}),
    "x-request-id": requestId,
    ...extra
  };

  const csrf = cookieStore.get("csrftoken")?.value;
  if (csrf && !("x-csrftoken" in headers) && !("X-CSRFToken" in headers)) headers["x-csrftoken"] = csrf;
  return { headers, requestId };
}

export async function backendFetchJson<T>(
  path: string,
  options: BackendFetchOptions = {}
): Promise<T> {
  const url = `${backendOrigin()}${path.startsWith("/") ? "" : "/"}${path}`;
  const method = (options.method ?? "GET").toUpperCase();
  const forwardCookies = options.forwardCookies ?? true;
  const { headers, requestId } = await buildForwardHeaders({
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

  const started = performance.now();
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      method,
      headers,
      cache,
      ...(nextConfig ? ({ next: nextConfig } as unknown as RequestInit) : {})
    });
  } catch (error) {
    logError("next backend fetch failed", {
      request_id: requestId,
      backend_path: path,
      http_method: method,
      duration_ms: durationSince(started),
      error
    });
    throw error;
  }

  logForStatus(res.status)("next backend fetch", {
    request_id: requestId,
    backend_path: path,
    http_method: method,
    status_code: res.status,
    duration_ms: durationSince(started)
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = (await res.json().catch(() => null)) as unknown;
      const detail = detailFromJson(body);
      if (!detail) {
        logWarning("backendFetchJson non-OK JSON response", {
          request_id: requestId,
          backend_path: path,
          status_code: res.status,
          body
        });
      }
      throw new BackendFetchError(detail || defaultMessageForStatus(res.status), { status: res.status, url });
    }
    const text = await res.text().catch(() => "");
    const preview = text.length > 500 ? `${text.slice(0, 500)}…` : text;
    logWarning("backendFetchJson non-OK non-JSON response", {
      request_id: requestId,
      backend_path: path,
      status_code: res.status,
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
  const { headers, requestId } = await buildForwardHeaders({
    forwardCookies,
    extra: {
      accept: "application/json",
      ...(options.headers ?? {})
    }
  });

  if (!methodNeedsCsrf(method)) {
    delete headers["x-csrftoken"];
  }

  const started = performance.now();
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      method,
      body: form,
      headers,
      cache: "no-store"
    });
  } catch (error) {
    logError("next backend form fetch failed", {
      request_id: requestId,
      backend_path: path,
      http_method: method,
      duration_ms: durationSince(started),
      error
    });
    throw error;
  }

  logForStatus(res.status)("next backend form fetch", {
    request_id: requestId,
    backend_path: path,
    http_method: method,
    status_code: res.status,
    duration_ms: durationSince(started)
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = (await res.json().catch(() => null)) as unknown;
      const detail = detailFromJson(body);
      if (!detail) {
        logWarning("backendFetchForm non-OK JSON response", {
          request_id: requestId,
          backend_path: path,
          status_code: res.status,
          body
        });
      }
      throw new BackendFetchError(detail || defaultMessageForStatus(res.status), { status: res.status, url });
    }
    const text = await res.text().catch(() => "");
    const preview = text.length > 500 ? `${text.slice(0, 500)}…` : text;
    logWarning("backendFetchForm non-OK non-JSON response", {
      request_id: requestId,
      backend_path: path,
      status_code: res.status,
      contentType,
      bodyPreview: preview
    });
    throw new BackendFetchError(defaultMessageForStatus(res.status), { status: res.status, url });
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function durationSince(started: number) {
  return Math.round((performance.now() - started) * 100) / 100;
}

function logForStatus(status: number) {
  if (status >= 500) return logError;
  if (status >= 400) return logWarning;
  return logInfo;
}
