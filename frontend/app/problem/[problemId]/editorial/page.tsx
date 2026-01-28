import CodePanel from "@/components/CodePanel";
import Container from "@/components/Container";
import Markdown from "@/components/Markdown";
import ProblemNav from "@/components/ProblemNav";
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
  return { title: `Editorial · ${problem.title}` };
}

export default async function Page({ params }: { params: Promise<{ problemId: string }> }) {
  const { problemId } = await params;
  const problem = await getProblem(problemId);

  return (
    <Container className="py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Editorial</h1>
          <p className="mt-1 text-slate-600">{problem.title}</p>
        </div>
        <div className="flex gap-2">
          <Link className="text-sm font-medium text-blue-600 hover:underline" href={`/problem/${problem.id}`}>
            Back to problem
          </Link>
        </div>
      </div>

      <ProblemNav active="editorial" problemId={problem.id} />

      <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
        <Markdown content={problem.editorial || "Editorial is not available."} />
      </div>

      <div className="mt-6">
        <CodePanel
          code={problem.code || ""}
          collapsible
          defaultCollapsed
          languageLabel="GNU C++17"
          title="Author's Solution"
        />
      </div>
    </Container>
  );
}
