import Container from "@/components/Container";
import ProblemNav from "@/components/ProblemNav";
import StatusPill from "@/components/StatusPill";
import { backendFetchJson } from "@/lib/backend.server";
import { formatDateTime } from "@/lib/format";
import type { ApiList, Problem, SubmissionListItem } from "@/lib/types";
import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";

function asArray<T>(data: ApiList<T>): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

const getProblem = cache(async (problemId: string) => {
  return await backendFetchJson<Problem>(`/api/problems/${encodeURIComponent(problemId)}/`);
});

export async function generateMetadata({ params }: { params: Promise<{ problemId: string }> }): Promise<Metadata> {
  const { problemId } = await params;
  const problem = await getProblem(problemId);
  return { title: `Submissions · ${problem.title}` };
}

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ problemId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { problemId } = await params;
  const sp = await searchParams;
  const username = typeof sp.username === "string" ? sp.username : typeof sp.user === "string" ? sp.user : null;
  const verdict = typeof sp.verdict === "string" ? sp.verdict : null;

  const problem = await getProblem(problemId);

  const qs = new URLSearchParams();
  qs.set("compact", "1");
  qs.set("limit", "100");
  qs.set("problem_id", problemId);
  if (username) qs.set("username", username);
  if (verdict) qs.set("verdict", verdict);

  const submissions = asArray(
    await backendFetchJson<ApiList<SubmissionListItem>>(`/api/submissions/?${qs.toString()}`)
  );

  return (
    <Container className="py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Submissions</h1>
          <p className="mt-1 text-slate-600">
            {username ? `User: ${username}` : "All users"} · {problem.title}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            className="text-sm font-medium text-blue-600 hover:underline"
            href={`/problem/${problem.id}`}
          >
            Back to problem
          </Link>
        </div>
      </div>

      <ProblemNav active="submissions" problemId={problem.id} />

      <div className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 font-semibold w-24">ID</th>
              <th className="px-4 py-3 font-semibold">Time</th>
              <th className="px-4 py-3 font-semibold hidden md:table-cell">User</th>
              <th className="px-4 py-3 font-semibold hidden lg:table-cell">Language</th>
              <th className="px-4 py-3 font-semibold w-28">Verdict</th>
              <th className="px-4 py-3 font-semibold w-28 hidden md:table-cell">Exec</th>
              <th className="px-4 py-3 font-semibold w-28 hidden md:table-cell">Memory</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {submissions.map((s) => (
              <tr className="bg-white" key={s.id}>
                <td className="px-4 py-3 font-mono">
                  <Link className="text-blue-600 hover:underline" href={`/submission/${s.id}`}>
                    {s.id}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-700">{formatDateTime(s.send_time)}</td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <Link className="text-blue-600 hover:underline" href={`/profile/${encodeURIComponent(s.username)}`}>
                    {s.username}
                  </Link>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-slate-700">{s.language}</td>
                <td className="px-4 py-3">
                  <StatusPill verdict={s.verdict} />
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-slate-700">
                  {s.time === null || s.time === undefined ? "—" : `${s.time} ms`}
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-slate-700">
                  {s.memory === null || s.memory === undefined ? "—" : `${s.memory} KB`}
                </td>
              </tr>
            ))}
            {submissions.length === 0 ? (
              <tr className="bg-white">
                <td className="px-4 py-10 text-center text-slate-600" colSpan={7}>
                  No submissions found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
