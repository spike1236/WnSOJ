import type { NextRequest } from "next/server";
import { proxyToRealtimeStream } from "@/lib/realtimeProxy.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await params;
  return proxyToRealtimeStream(request, `/sse/submission/${encodeURIComponent(submissionId)}`);
}
