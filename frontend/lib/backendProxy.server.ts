import "server-only";

import { NextResponse } from "next/server";

function backendOrigin() {
  return process.env.BACKEND_ORIGIN?.replace(/\/+$/, "") || "http://localhost:8000";
}

function internalApiKey() {
  return process.env.INTERNAL_API_KEY?.trim() || "";
}

function copyResponseHeaders(from: Response, to: NextResponse) {
  for (const [key, value] of from.headers.entries()) {
    const k = key.toLowerCase();
    if (k === "content-encoding" || k === "content-length" || k === "connection" || k === "transfer-encoding") continue;
    if (k === "set-cookie") continue;
    to.headers.set(key, value);
  }
  const anyHeaders = from.headers as unknown as { getSetCookie?: () => string[] };
  const setCookies = typeof anyHeaders.getSetCookie === "function" ? anyHeaders.getSetCookie() : [];
  if (setCookies.length) {
    for (const c of setCookies) to.headers.append("set-cookie", c);
  } else {
    const single = from.headers.get("set-cookie");
    if (single) to.headers.set("set-cookie", single);
  }
}

export async function proxyToBackend(request: Request, backendPath: string, init?: RequestInit) {
  const url = `${backendOrigin()}${backendPath.startsWith("/") ? "" : "/"}${backendPath}`;
  const incomingCookie = request.headers.get("cookie") || "";
  const origin = request.headers.get("origin") || "";
  const referer = request.headers.get("referer") || "";
  const csrf = request.headers.get("x-csrftoken") || "";
  const internalKey = internalApiKey();

  const headers = new Headers(init?.headers);
  if (incomingCookie) headers.set("cookie", incomingCookie);
  if (origin) headers.set("origin", origin);
  if (referer) headers.set("referer", referer);
  if (csrf && !headers.has("x-csrftoken")) headers.set("x-csrftoken", csrf);
  if (internalKey && !headers.has("x-internal-api-key")) headers.set("x-internal-api-key", internalKey);

  const res = await fetch(url, {
    redirect: "manual",
    cache: "no-store",
    ...init,
    headers
  });

  const body = await res.arrayBuffer();
  const out = new NextResponse(body, { status: res.status });
  copyResponseHeaders(res, out);
  return out;
}
