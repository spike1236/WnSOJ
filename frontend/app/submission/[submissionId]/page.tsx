import CodePanel from "@/components/CodePanel";
import Container from "@/components/Container";
import StatusPill from "@/components/StatusPill";
import { backendFetchJson } from "@/lib/backend.server";
import { formatDateTime } from "@/lib/format";
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
    <Container className="py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Submission #{submissionId}</h1>
          <p className="mt-1 text-slate-600">Details and source code</p>
        </div>
        <Link className="text-sm font-medium text-blue-600 hover:underline" href="/submissions">
          Back to submissions
        </Link>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      ) : null}

      {submission ? (
        <div className="mt-6 grid gap-6">
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold w-24">ID</th>
                  <th className="px-4 py-3 font-semibold">Time</th>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Problem</th>
                  <th className="px-4 py-3 font-semibold w-28">Lang</th>
                  <th className="px-4 py-3 font-semibold w-28">Verdict</th>
                  <th className="px-4 py-3 font-semibold w-28 hidden md:table-cell">Exec</th>
                  <th className="px-4 py-3 font-semibold w-28 hidden md:table-cell">Memory</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr className="bg-white">
                  <td className="px-4 py-3 font-mono text-slate-700">{submission.id}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDateTime(submission.send_time)}</td>
                  <td className="px-4 py-3">
                    <Link className="text-blue-600 hover:underline" href={`/profile/${encodeURIComponent(submission.user.username)}`}>
                      {submission.user.username}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link className="text-blue-600 hover:underline" href={`/problem/${submission.problem.id}`}>
                      {submission.problem.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{submission.language}</td>
                  <td className="px-4 py-3">
                    <StatusPill verdict={submission.verdict} />
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-700">
                    {submission.time === null || submission.time === undefined ? "—" : `${submission.time} ms`}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-700">
                    {submission.memory === null || submission.memory === undefined ? "—" : `${submission.memory} KB`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <CodePanel code={submission.code} languageLabel={submission.language} title="Source Code" />
        </div>
      ) : null}
    </Container>
  );
}
