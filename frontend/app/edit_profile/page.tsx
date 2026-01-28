import Container from "@/components/Container";
import { backendFetchJson } from "@/lib/backend.server";
import type { UserDetail } from "@/lib/types";
import Link from "next/link";
import EditProfileClient from "@/app/edit_profile/EditProfileClient";

export const metadata = {
  title: "Edit Profile"
};

export default async function Page({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;
  const success = typeof sp.success === "string" ? sp.success : null;

  let user: UserDetail | null = null;
  try {
    user = await backendFetchJson<UserDetail>("/api/profile/");
  } catch {
    user = null;
  }

  if (!user) {
    return (
      <Container className="py-10">
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Edit Profile</h1>
          <p className="mt-2 text-slate-600">Login required.</p>
          <div className="mt-5">
            <Link className="text-sm font-medium text-blue-600 hover:underline" href="/login">
              Go to login
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Profile</h1>
          <p className="mt-1 text-slate-600">{user.username}</p>
        </div>
        <Link className="text-sm font-medium text-blue-600 hover:underline" href={`/profile/${encodeURIComponent(user.username)}`}>
          View profile
        </Link>
      </div>

      {success ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success === "icon" ? "Profile picture updated." : success === "password" ? "Password updated." : "Saved."}
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <EditProfileClient user={user} />
    </Container>
  );
}
