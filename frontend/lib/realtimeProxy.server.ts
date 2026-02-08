import "server-only";

import { NextResponse } from "next/server";

function realtimeOrigin() {
  return process.env.REALTIME_ORIGIN?.replace(/\/+$/, "") || "http://localhost:9000";
}

function internalApiKey() {
  return process.env.INTERNAL_API_KEY?.trim() || "";
}

function defaultMessageForStatus(status: number) {
  if (status === 400) return "Bad request.";
  if (status === 401) return "Not authenticated.";
  if (status === 403) return "Forbidden.";
  if (status === 404) return "Not found.";
  if (status === 429) return "Too many requests.";
  if (status >= 500) return "Server error.";
  return `Request failed (${status}).`;
}

function copyResponseHeadersToHeaders(from: Response, to: Headers) {
  for (const [key, value] of from.headers.entries()) {
    const k = key.toLowerCase();
    if (k === "content-encoding" || k === "content-length" || k === "connection" || k === "transfer-encoding") continue;
    if (k === "set-cookie") continue;
    to.set(key, value);
  }
  const anyHeaders = from.headers as unknown as { getSetCookie?: () => string[] };
  const setCookies = typeof anyHeaders.getSetCookie === "function" ? anyHeaders.getSetCookie() : [];
  if (setCookies.length) {
    for (const c of setCookies) to.append("set-cookie", c);
  } else {
    const single = from.headers.get("set-cookie");
    if (single) to.set("set-cookie", single);
  }
}

export async function proxyToRealtimeStream(request: Request, path: string, init?: RequestInit) {
  const url = `${realtimeOrigin()}${path.startsWith("/") ? "" : "/"}${path}`;
  const origin = request.headers.get("origin") || "";
  const referer = request.headers.get("referer") || "";
  const internalKey = internalApiKey();

  const headers = new Headers(init?.headers);
  if (origin) headers.set("origin", origin);
  if (referer) headers.set("referer", referer);
  if (internalKey && !headers.has("x-internal-api-key")) headers.set("x-internal-api-key", internalKey);

  const res = await fetch(url, {
    redirect: "manual",
    cache: "no-store",
    ...init,
    headers
  });

  const contentType = res.headers.get("content-type") || "";
  if (res.status >= 400) {
    const shouldSanitize =
      contentType.includes("text/html") || contentType.includes("text/plain") || contentType === "";
    if (shouldSanitize) {
      const text = await res.text().catch(() => "");
      const preview = text.length > 500 ? `${text.slice(0, 500)}…` : text;
      console.error("proxyToRealtimeStream sanitized error response", {
        url,
        status: res.status,
        contentType,
        bodyPreview: preview
      });
      return NextResponse.json({ detail: defaultMessageForStatus(res.status) }, { status: res.status });
    }
  }

  const outHeaders = new Headers();
  copyResponseHeadersToHeaders(res, outHeaders);
  return new Response(res.body, { status: res.status, headers: outHeaders });
}

