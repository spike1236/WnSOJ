import CodePanel from "@/components/CodePanel";
import Container from "@/components/Container";
import Markdown from "@/components/Markdown";
import { PageHeader, SectionPanel } from "@/components/PageShell";
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
    <Container className="py-8 sm:py-10">
      <PageHeader
        actions={
          <Link className="action-link" href={`/problem/${problem.id}`}>
            Statement
          </Link>
        }
        description={problem.title}
        kicker="Editorial"
        title="Solution Walkthrough"
      />

      <ProblemNav active="editorial" problemId={problem.id} />

      <div className="mt-6 grid gap-6">
        <SectionPanel title="Editorial">
          <div className="p-5 sm:p-6">
            <Markdown content={problem.editorial || "Editorial is not available."} />
          </div>
        </SectionPanel>

        <CodePanel
          code={problem.code || ""}
          collapsible
          defaultCollapsed
          languageLabel="GNU C++23"
          title="Author's Solution"
        />
      </div>
    </Container>
  );
}
