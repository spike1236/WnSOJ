import { proxyToBackendStream } from "@/lib/backendProxy.server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await params;
  return proxyToBackendStream(request, `/api/submissions/${encodeURIComponent(submissionId)}/stream/`);
}
