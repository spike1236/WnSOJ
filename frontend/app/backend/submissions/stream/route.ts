import type { NextRequest } from "next/server";
import { proxyToRealtimeStream } from "@/lib/realtimeProxy.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const ids = url.searchParams.get("ids") ?? "";
  const qs = new URLSearchParams();
  if (ids) qs.set("ids", ids);
  const suffix = qs.toString();
  return proxyToRealtimeStream(request, `/sse/submissions${suffix ? `?${suffix}` : ""}`);
}
