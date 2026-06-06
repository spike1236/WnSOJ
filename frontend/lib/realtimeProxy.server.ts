import "server-only";

import { NextResponse } from "next/server";

import { defaultMessageForStatus } from "@/lib/httpStatus";
import { logError, logInfo, logWarning, normalizeRequestId } from "@/lib/logger.server";
import { copyResponseHeadersToHeaders } from "@/lib/proxyHeaders.server";

function realtimeOrigin() {
  return process.env.REALTIME_ORIGIN?.replace(/\/+$/, "") || "http://localhost:9000";
}

function internalApiKey() {
  return process.env.INTERNAL_API_KEY?.trim() || "";
}

export async function proxyToRealtimeStream(request: Request, path: string, init?: RequestInit) {
  const url = `${realtimeOrigin()}${path.startsWith("/") ? "" : "/"}${path}`;
  const requestId = normalizeRequestId(request.headers.get("x-request-id"));
  const origin = request.headers.get("origin") || "";
  const referer = request.headers.get("referer") || "";
  const internalKey = internalApiKey();

  const headers = new Headers(init?.headers);
  if (origin) headers.set("origin", origin);
  if (referer) headers.set("referer", referer);
  if (internalKey && !headers.has("x-internal-api-key")) headers.set("x-internal-api-key", internalKey);
  headers.set("x-request-id", requestId);

  const method = (init?.method || request.method || "GET").toUpperCase();
  const started = performance.now();
  let res: Response;
  try {
    res = await fetch(url, {
      redirect: "manual",
      cache: "no-store",
      ...init,
      headers
    });
  } catch (error) {
    logError("next realtime proxy failed", {
      request_id: requestId,
      realtime_path: path,
      http_method: method,
      duration_ms: durationSince(started),
      error
    });
    throw error;
  }

  logForStatus(res.status)("next realtime proxy", {
    request_id: requestId,
    realtime_path: path,
    http_method: method,
    status_code: res.status,
    duration_ms: durationSince(started)
  });

  const contentType = res.headers.get("content-type") || "";
  if (res.status >= 400) {
    const shouldSanitize =
      contentType.includes("text/html") || contentType.includes("text/plain") || contentType === "";
    if (shouldSanitize) {
      const text = await res.text().catch(() => "");
      const preview = text.length > 500 ? `${text.slice(0, 500)}…` : text;
      logWarning("proxyToRealtimeStream sanitized error response", {
        request_id: requestId,
        realtime_path: path,
        status_code: res.status,
        contentType,
        bodyPreview: preview
      });
      const out = NextResponse.json({ detail: defaultMessageForStatus(res.status) }, { status: res.status });
      out.headers.set("X-Request-ID", requestId);
      return out;
    }
  }

  const outHeaders = new Headers();
  copyResponseHeadersToHeaders(res, outHeaders);
  outHeaders.set("X-Request-ID", requestId);
  return new Response(res.body, { status: res.status, headers: outHeaders });
}

function durationSince(started: number) {
  return Math.round((performance.now() - started) * 100) / 100;
}

function logForStatus(status: number) {
  if (status >= 500) return logError;
  if (status >= 400) return logWarning;
  return logInfo;
}
