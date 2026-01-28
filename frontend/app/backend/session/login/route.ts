import { proxyToBackend } from "@/lib/backendProxy.server";

export async function POST(request: Request) {
  const body = await request.json();
  return proxyToBackend(request, "/api/session/login/", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body)
  });
}

