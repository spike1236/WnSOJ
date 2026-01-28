import { proxyToBackend } from "@/lib/backendProxy.server";

export async function GET(request: Request) {
  return proxyToBackend(request, "/api/session/logout/", { method: "GET" });
}

export async function POST(request: Request) {
  return proxyToBackend(request, "/api/session/logout/", { method: "POST" });
}
