import CodePanel from "@/components/CodePanel";
import Container from "@/components/Container";
import { EmptyState, PageHeader } from "@/components/PageShell";
import SubmissionDetailRowClient from "@/components/SubmissionDetailRowClient";
import { backendFetchJson } from "@/lib/backend.server";
import type { Submission } from "@/lib/types";
import Link from "next/link";

export default async function Page({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await params;
  let submission: Submission | null = null;
  let error: string | null = null;
  try {
    submission = await backendFetchJson<Submission>(`/api/submissions/${encodeURIComponent(submissionId)}/`);
  } catch {
    error = "Submission is not accessible.";
  }

  return (
    <Container className="py-8 sm:py-10">
      <PageHeader
        actions={
          <Link className="action-link" href="/submissions">
            Submissions
          </Link>
        }
        description={submission ? submission.problem.title : "Details and source code"}
        kicker="Submission"
        title={`#${submissionId}`}
      />

      {error ? (
        <div className="mt-6">
          <EmptyState
            action={
              <Link className="action-link" href="/submissions">
                Back to submissions
              </Link>
            }
            description={error}
            title="Submission unavailable"
          />
        </div>
      ) : null}

      {submission ? (
        <div className="mt-6 grid gap-6">
          <div className="surface overflow-hidden">
            <div className="overflow-x-auto subtle-scrollbar">
            <table className="data-table min-w-[920px]">
              <thead>
                <tr>
                  <th className="w-24">ID</th>
                  <th>Time</th>
                  <th>User</th>
                  <th>Problem</th>
                  <th className="w-28">Lang</th>
                  <th className="w-32">Verdict</th>
                  <th className="hidden w-28 md:table-cell">Exec</th>
                  <th className="hidden w-28 md:table-cell">Memory</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <SubmissionDetailRowClient
                  id={submission.id}
                  sendTime={submission.send_time}
                  username={submission.user.username}
                  problemId={submission.problem.id}
                  problemTitle={submission.problem.title}
                  language={submission.language}
                  verdict={submission.verdict}
                  time={submission.time}
                  memory={submission.memory}
                />
              </tbody>
            </table>
            </div>
          </div>

          <CodePanel code={submission.code} languageLabel={submission.language} title="Source Code" />
        </div>
      ) : null}
    </Container>
  );
}
