import "server-only";

import { NextResponse } from "next/server";

import { defaultMessageForStatus } from "@/lib/httpStatus";
import { copyResponseHeadersToHeaders } from "@/lib/proxyHeaders.server";

function backendOrigin() {
  return process.env.BACKEND_ORIGIN?.replace(/\/+$/, "") || "http://localhost:8000";
}

function internalApiKey() {
  return process.env.INTERNAL_API_KEY?.trim() || "";
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

  const contentType = res.headers.get("content-type") || "";
  if (res.status >= 400) {
    const shouldSanitize =
      contentType.includes("text/html") || contentType.includes("text/plain") || contentType === "";
    if (shouldSanitize) {
      const text = await res.text().catch(() => "");
      const preview = text.length > 500 ? `${text.slice(0, 500)}…` : text;
      console.error("proxyToBackend sanitized error response", {
        url,
        status: res.status,
        contentType,
        bodyPreview: preview
      });
      return NextResponse.json({ detail: defaultMessageForStatus(res.status) }, { status: res.status });
    }
  }

  const body = await res.arrayBuffer();
  const out = new NextResponse(body, { status: res.status });
  copyResponseHeadersToHeaders(res, out.headers);
  return out;
}
