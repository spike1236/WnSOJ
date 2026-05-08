import CodeEditor from "@/components/CodeEditor";
import Container from "@/components/Container";
import Markdown from "@/components/Markdown";
import { Badge, PageHeader, SectionPanel } from "@/components/PageShell";
import ProblemNav from "@/components/ProblemNav";
import SubmitSolutionButton from "@/components/SubmitSolutionButton";
import { submitSolutionAction } from "@/app/actions/submissions";
import { backendFetchJson } from "@/lib/backend.server";
import type { Problem } from "@/lib/types";
import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";

const getProblem = cache(async (problemId: string) => {
  return await backendFetchJson<Problem>(`/api/problems/${encodeURIComponent(problemId)}/`);
});

export async function generateMetadata({ params }: { params: Promise<{ problemId: string }> }): Promise<Metadata> {
  const { problemId } = await params;
  const problem = await getProblem(problemId);
  return { title: problem.title };
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
  const error = typeof sp.error === "string" ? sp.error : null;
  const problem = await getProblem(problemId);
  const categories = (problem.categories ?? [])
    .map((c) => c.long_name)
    .filter((name) => name.toLowerCase() !== "problemset");

  return (
    <Container className="py-8 sm:py-10">
      <PageHeader
        actions={
          <Link className="action-link" href="/problems">
            Problems
          </Link>
        }
        description={categories.length ? categories.join(", ") : "Programming challenge"}
        kicker={`Problem ${problem.id}`}
        title={problem.title}
      />

      <ProblemNav active="statement" problemId={problem.id} />

      {error ? (
        <div className="mt-6 rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <SectionPanel className="lg:row-span-2" title="Problem Statement">
          <div className="p-5 sm:p-6">
            <Markdown content={problem.statement} />
          </div>
        </SectionPanel>

        <aside className="surface h-fit p-5 lg:sticky lg:top-24">
          <div className="text-sm font-bold uppercase tracking-wide text-slate-500">Quick Facts</div>
          <div className="mt-4 grid gap-3">
            <div className="soft-panel p-3">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Time</div>
              <div className="mt-1 text-lg font-bold text-slate-950">{problem.time_limit} sec</div>
            </div>
            <div className="soft-panel p-3">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Memory</div>
              <div className="mt-1 text-lg font-bold text-slate-950">{problem.memory_limit} MB</div>
            </div>
          </div>
          {categories.length ? (
            <div className="mt-5">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Tags</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {categories.map((name) => (
                  <Badge key={name}>{name}</Badge>
                ))}
              </div>
            </div>
          ) : null}
          <div className="mt-5 grid gap-2">
            <Link className="action-primary" href="#submit">
              Submit Solution
            </Link>
            <Link className="action-link" href={`/problem/${problem.id}/submissions`}>
              View Submissions
            </Link>
          </div>
        </aside>

        <SectionPanel className="lg:col-start-1" title="Code Editor">
          <form action={submitSolutionAction} className="grid gap-4 p-5 sm:p-6" id="submit">
            <input name="problem_id" type="hidden" value={problem.id} />
            <CodeEditor name="code" />
            <div className="flex justify-end">
              <SubmitSolutionButton />
            </div>
          </form>
        </SectionPanel>
      </div>
    </Container>
  );
}
