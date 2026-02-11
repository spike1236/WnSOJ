import Container from "@/components/Container";
import SubmissionsTableClient from "@/components/SubmissionsTableClient";
import { backendFetchJson } from "@/lib/backend.server";
import { asArray } from "@/lib/apiList";
import type { ApiList, SubmissionListItem } from "@/lib/types";
import Link from "next/link";

export const metadata = {
  title: "Submissions"
};

export default async function Page({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const username = typeof sp.username === "string" ? sp.username : null;
  const verdict = typeof sp.verdict === "string" ? sp.verdict : null;

  const qs = new URLSearchParams();
  qs.set("compact", "1");
  qs.set("limit", "50");
  if (username) qs.set("username", username);
  if (verdict) qs.set("verdict", verdict);

  const submissions = asArray(await backendFetchJson<ApiList<SubmissionListItem>>(`/api/submissions/?${qs.toString()}`));

  return (
    <Container className="py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Submissions</h1>
          <p className="mt-1 text-slate-600">
            {username ? `User: ${username}` : "All users"} {verdict ? `· Verdict: ${verdict}` : ""}
          </p>
        </div>
        <Link className="text-sm font-medium text-blue-600 hover:underline" href="/problems">
          Browse problems
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 font-semibold w-24">ID</th>
              <th className="px-4 py-3 font-semibold">Time</th>
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Problem</th>
              <th className="px-4 py-3 font-semibold hidden lg:table-cell">Language</th>
              <th className="px-4 py-3 font-semibold w-28">Verdict</th>
              <th className="px-4 py-3 font-semibold hidden md:table-cell w-28">Exec</th>
              <th className="px-4 py-3 font-semibold hidden md:table-cell w-28">Memory</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <SubmissionsTableClient initial={submissions.slice(0, 50)} />
          </tbody>
        </table>
      </div>
    </Container>
  );
}
