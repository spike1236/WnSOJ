import { proxyToBackend } from "@/lib/backendProxy.server";

export async function POST(request: Request) {
  const form = await request.formData();
  return proxyToBackend(request, "/api/profile/icon/", { method: "POST", body: form });
}

