import { backendFetchJson } from "@/lib/backend.server";
import type { UserDetail } from "@/lib/types";
import SiteHeaderClient from "@/components/SiteHeaderClient";

async function currentUser() {
  try {
    return await backendFetchJson<UserDetail>("/api/profile/");
  } catch {
    return null;
  }
}

export default async function SiteHeader() {
  const user = await currentUser();
  return <SiteHeaderClient user={user} />;
}
