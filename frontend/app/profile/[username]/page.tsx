import Container from "@/components/Container";
import StatusPill from "@/components/StatusPill";
import { BackendFetchError, backendFetchJson } from "@/lib/backend.server";
import { formatDateTime } from "@/lib/format";
import type { SubmissionListItem, UserDetail, UserPublic } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";

type PublicProfileResponse = {
  user: UserPublic;
  stats: { verdict_counts: Record<string, number> };
  recent_submissions: SubmissionListItem[];
};

function verdictLabel(code: string) {
  if (code === "AC") return "Accepted (AC)";
  if (code === "CE") return "Compilation Error (CE)";
  if (code === "RE") return "Runtime Error (RE)";
  if (code === "WA") return "Wrong Answer (WA)";
  if (code === "TLE") return "Time Limit (TLE)";
  if (code === "MLE") return "Memory Limit (MLE)";
  return code;
}

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  let profile: PublicProfileResponse;
  try {
    profile = await backendFetchJson<PublicProfileResponse>(`/api/users/${encodeURIComponent(username)}/`);
  } catch (e) {
    if (e instanceof BackendFetchError && e.status === 404) {
      notFound();
    }
    throw e;
  }
  let me: UserDetail | null = null;
  try {
    me = await backendFetchJson<UserDetail>("/api/profile/");
  } catch {
    me = null;
  }
  const isMe = me?.username === profile.user.username;
  const myEmail = isMe && me ? me.email : "";
  const verdictCounts = profile.stats?.verdict_counts ?? {};
  const codes = ["AC", "CE", "RE", "WA", "TLE", "MLE"];

  return (
    <Container className="py-10">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <img
                alt={`${profile.user.username}'s profile picture`}
                className="h-28 w-28 rounded-full border object-cover"
                src={profile.user.icon170_url ?? "/img/favicon.svg"}
              />
              <div className="mt-3 text-xl font-semibold tracking-tight">{profile.user.username}</div>
              {isMe ? (
                <Link
                  className="mt-3 inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
                  href="/edit_profile"
                >
                  Edit Profile
                </Link>
              ) : null}
              {profile.user.account_type && profile.user.account_type !== 1 ? (
                <Link
                  className="mt-4 inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
                  href={`/jobs?author=${encodeURIComponent(profile.user.username)}`}
                >
                  View jobs
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between gap-3">
                <div className="text-slate-600">Full Name</div>
                <div className="font-medium text-slate-900">
                  {(profile.user.first_name || "") + " " + (profile.user.last_name || "")}
                </div>
              </div>
              {isMe ? (
                <div className="flex justify-between gap-3">
                  <div className="text-slate-600">Email</div>
                  <div className="font-medium text-slate-900">{myEmail || "—"}</div>
                </div>
              ) : null}
              <div className="flex justify-between gap-3">
                <div className="text-slate-600">Phone</div>
                <div className="font-medium text-slate-900">{profile.user.phone_number || "—"}</div>
              </div>
              <div className="flex justify-between gap-3">
                <div className="text-slate-600">Account Type</div>
                <div className="font-medium text-slate-900">
                  {profile.user.account_type === 2 ? "Business" : "Common"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Submission Stats</h2>
            <div className="mt-4 grid gap-2">
              {codes.map((code) => (
                <div className="flex items-center justify-between gap-3 text-sm" key={code}>
                  <div className="text-slate-700">{verdictLabel(code)}</div>
                  <div className="rounded-full border bg-slate-50 px-3 py-1 font-mono text-slate-700">
                    {verdictCounts[code] ?? 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-12">
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="border-b bg-slate-50 px-6 py-4">
              <h2 className="text-base font-semibold tracking-tight text-slate-900">Recent Submissions</h2>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-slate-700">
                <tr className="border-b">
                  <th className="px-6 py-3 font-semibold w-24">ID</th>
                  <th className="px-6 py-3 font-semibold">Time</th>
                  <th className="px-6 py-3 font-semibold">Problem</th>
                  <th className="px-6 py-3 font-semibold w-28">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {profile.recent_submissions.map((s) => (
                  <tr className="bg-white" key={s.id}>
                    <td className="px-6 py-3 font-mono">
                      <Link className="text-blue-600 hover:underline" href={`/submission/${s.id}`}>
                        {s.id}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-slate-700">{formatDateTime(s.send_time)}</td>
                    <td className="px-6 py-3">
                      <Link className="font-medium text-slate-900 hover:underline" href={`/problem/${s.problem_id}`}>
                        {s.problem_title}
                      </Link>
                    </td>
                    <td className="px-6 py-3">
                      <StatusPill verdict={s.verdict} />
                    </td>
                  </tr>
                ))}
                {profile.recent_submissions.length === 0 ? (
                  <tr className="bg-white">
                    <td className="px-6 py-10 text-center text-slate-600" colSpan={4}>
                      No submissions yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Container>
  );
}
