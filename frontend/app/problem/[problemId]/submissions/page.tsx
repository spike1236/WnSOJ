import Container from "@/components/Container";
import { Badge, PageHeader } from "@/components/PageShell";
import ProblemNav from "@/components/ProblemNav";
import SubmissionsTableClient from "@/components/SubmissionsTableClient";
import { backendFetchJson } from "@/lib/backend.server";
import { asArray } from "@/lib/apiList";
import type { ApiList, Problem, SubmissionListItem } from "@/lib/types";
import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";

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
  const filterCodes = ["all", "AC", "WA", "TLE", "MLE", "CE", "RE"];
  const filterHref = (code: string) => {
    const next = new URLSearchParams();
    if (username) next.set("username", username);
    if (code !== "all") next.set("verdict", code);
    const str = next.toString();
    return `/problem/${problem.id}/submissions${str ? `?${str}` : ""}`;
  };

  return (
    <Container className="py-8 sm:py-10">
      <PageHeader
        actions={
          <Link className="action-link" href={`/problem/${problem.id}`}>
            Statement
          </Link>
        }
        description={username ? `Filtered to ${username} on ${problem.title}.` : problem.title}
        kicker="Problem Judge"
        title="Submissions"
      />

      <ProblemNav active="submissions" problemId={problem.id} />

      <div className="mt-4 flex flex-wrap gap-2">
        {filterCodes.map((code) => (
          <Link href={filterHref(code)} key={code}>
            <Badge tone={(verdict ?? "all") === code ? "blue" : "slate"}>{code === "all" ? "All" : code}</Badge>
          </Link>
        ))}
      </div>

      <div className="surface mt-6 overflow-hidden">
        <div className="overflow-x-auto subtle-scrollbar">
          <table className="data-table min-w-[920px]">
            <thead>
              <tr>
                <th className="w-24">ID</th>
                <th>Time</th>
                <th>User</th>
                <th>Problem</th>
                <th className="hidden lg:table-cell">Language</th>
                <th className="w-32">Verdict</th>
                <th className="hidden w-28 md:table-cell">Exec</th>
                <th className="hidden w-28 md:table-cell">Memory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <SubmissionsTableClient initial={submissions.slice(0, 50)} />
            </tbody>
          </table>
        </div>
      </div>
    </Container>
  );
}
