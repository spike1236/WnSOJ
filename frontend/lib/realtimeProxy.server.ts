import "server-only";

import { NextResponse } from "next/server";

import { defaultMessageForStatus } from "@/lib/httpStatus";
import { copyResponseHeadersToHeaders } from "@/lib/proxyHeaders.server";

function realtimeOrigin() {
  return process.env.REALTIME_ORIGIN?.replace(/\/+$/, "") || "http://localhost:9000";
}

function internalApiKey() {
  return process.env.INTERNAL_API_KEY?.trim() || "";
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
