import CodeEditor from "@/components/CodeEditor";
import Container from "@/components/Container";
import Markdown from "@/components/Markdown";
import ProblemNav from "@/components/ProblemNav";
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

  return (
    <Container className="py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{problem.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full border bg-slate-50 px-3 py-1 text-slate-700">
              Time limit: {problem.time_limit} sec
            </span>
            <span className="rounded-full border bg-slate-50 px-3 py-1 text-slate-700">
              Memory limit: {problem.memory_limit} MB
            </span>
            {problem.categories?.length ? (
              <span className="rounded-full border bg-slate-50 px-3 py-1 text-slate-700">
                {problem.categories
                  .map((c) => c.long_name)
                  .filter((name) => name.toLowerCase() !== "problemset")
                  .join(", ")}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          <Link className="text-sm font-medium text-blue-600 hover:underline" href="/problems">
            Back to problems
          </Link>
        </div>
      </div>

      <ProblemNav active="statement" problemId={problem.id} />

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">Problem Statement</h2>
          <div className="mt-4">
            <Markdown content={problem.statement} />
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">Code Editor</h2>
          <p className="mt-1 text-sm text-slate-600">
            Submit a solution. Authentication is required to create submissions.
          </p>
          <form action={submitSolutionAction} className="mt-4 grid gap-4">
            <input name="problem_id" type="hidden" value={problem.id} />
            <CodeEditor name="code" />
            <div className="flex justify-end">
              <button
                className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700"
                type="submit"
              >
                Submit Solution
              </button>
            </div>
          </form>
        </div>
      </div>
    </Container>
  );
}
