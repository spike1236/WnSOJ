import { NextResponse } from "next/server";
import { backendFetchJson } from "@/lib/backend.server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    await backendFetchJson("/api/session/logout/");
  } catch {}

  const cookieStore = await cookies();
  cookieStore.set("sessionid", "", { path: "/", expires: new Date(0) });
  cookieStore.set("csrftoken", "", { path: "/", expires: new Date(0) });
  return NextResponse.redirect(new URL("/home", request.url));
}
