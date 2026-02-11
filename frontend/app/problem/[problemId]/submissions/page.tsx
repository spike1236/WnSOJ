import Container from "@/components/Container";
import ProblemNav from "@/components/ProblemNav";
import SubmissionsTableClient from "@/components/SubmissionsTableClient";
import { backendFetchJson } from "@/lib/backend.server";
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
  qs.set("limit", "50");
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
