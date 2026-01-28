import { proxyToBackend } from "@/lib/backendProxy.server";

export async function PATCH(request: Request) {
  const body = await request.json();
  return proxyToBackend(request, "/api/profile/", {
    method: "PATCH",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body)
  });
}

