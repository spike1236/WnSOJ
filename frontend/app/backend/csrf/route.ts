import { proxyToBackend } from "@/lib/backendProxy.server";

export async function GET(request: Request) {
  return proxyToBackend(request, "/api/csrf/", { method: "GET" });
}

