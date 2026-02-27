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
  const username = typeof sp.username === "string" ? sp.username.trim() : "";
  const verdict = typeof sp.verdict === "string" ? sp.verdict.trim().toUpperCase() : "";

  const qs = new URLSearchParams();
  qs.set("compact", "1");
  qs.set("limit", "50");
  if (username) qs.set("username", username);
  if (verdict) qs.set("verdict", verdict);

  const submissions = asArray(await backendFetchJson<ApiList<SubmissionListItem>>(`/api/submissions/?${qs.toString()}`));

  return (
    <Container className="py-10">
      <section className="card-surface lift-in rounded-3xl p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Submission Feed</h1>
            <p className="mt-2 text-sm text-slate-600">Monitor verdicts in real time and drill down by user or result.</p>
          </div>
          <Link className="text-sm font-semibold text-[#304765] hover:underline" href="/problems">
            Browse Problems
          </Link>
        </div>

        <form action="/submissions" className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_auto]" method="GET">
          <input
            className="h-11 rounded-full border border-slate-300 bg-white px-4 text-sm outline-none ring-[#304765] focus:ring-2"
            defaultValue={username}
            name="username"
            placeholder="Filter by username"
            type="text"
          />
          <select
            className="h-11 rounded-full border border-slate-300 bg-white px-4 text-sm outline-none ring-[#304765] focus:ring-2"
            defaultValue={verdict}
            name="verdict"
          >
            <option value="">All verdicts</option>
            <option value="IQ">IQ</option>
            <option value="AC">AC</option>
            <option value="WA">WA</option>
            <option value="CE">CE</option>
            <option value="RE">RE</option>
            <option value="TLE">TLE</option>
            <option value="MLE">MLE</option>
          </select>
          <button className="h-11 rounded-full bg-[#304765] px-5 text-sm font-semibold text-white hover:bg-[#25374e]" type="submit">
            Apply
          </button>
        </form>
      </section>

      <section className="card-surface mt-6 overflow-hidden rounded-3xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100/70 text-slate-700">
            <tr>
              <th className="w-24 px-4 py-3 font-semibold">ID</th>
              <th className="px-4 py-3 font-semibold">Time</th>
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Problem</th>
              <th className="hidden px-4 py-3 font-semibold lg:table-cell">Language</th>
              <th className="w-28 px-4 py-3 font-semibold">Verdict</th>
              <th className="hidden w-28 px-4 py-3 font-semibold md:table-cell">Exec</th>
              <th className="hidden w-28 px-4 py-3 font-semibold md:table-cell">Memory</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <SubmissionsTableClient initial={submissions.slice(0, 50)} />
          </tbody>
        </table>
      </section>
    </Container>
  );
}
