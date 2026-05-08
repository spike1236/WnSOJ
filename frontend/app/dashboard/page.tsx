import Container from "@/components/Container";
import LocalTime from "@/components/LocalTime";
import StatusPill from "@/components/StatusPill";
import { backendFetchJson } from "@/lib/backend.server";
import { formatNumber, formatSalaryRange } from "@/lib/format";
import type { Overview } from "@/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard"
};

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="text-sm font-medium text-slate-600">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{detail}</div>
    </div>
  );
}

function ProgressRow({ label, count, max }: { label: string; count: number; max: number }) {
  const width = max > 0 && count > 0 ? Math.max(4, Math.round((count / max) * 100)) : 0;
  return (
    <div className="grid grid-cols-[3rem_1fr_3rem] items-center gap-3 text-sm">
      <StatusPill verdict={label} />
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${width}%` }} />
      </div>
      <div className="text-right font-mono text-slate-700">{count}</div>
    </div>
  );
}

export default async function Page() {
  const overview = await backendFetchJson<Overview>("/api/overview/");
  const verdictCodes = ["AC", "WA", "TLE", "MLE", "CE", "RE", "IQ", "T"];
  const maxVerdictCount = Math.max(1, ...verdictCodes.map((code) => overview.verdict_counts[code] ?? 0));

  return (
    <Container className="py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-slate-600">A compact view of platform activity, judging health, and new work.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
            href="/submissions"
          >
            Submissions
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            href="/problems"
          >
            Solve
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          detail={`${formatNumber(overview.stats.accepted_submissions)} accepted`}
          label="Submissions"
          value={formatNumber(overview.stats.submissions)}
        />
        <StatCard
          detail={`${overview.stats.acceptance_rate}% accepted after judging`}
          label="Acceptance"
          value={`${overview.stats.acceptance_rate}%`}
        />
        <StatCard
          detail={`${formatNumber(overview.stats.categories)} categories`}
          label="Problems"
          value={formatNumber(overview.stats.problems)}
        />
        <StatCard
          detail={`${formatNumber(overview.stats.business_accounts)} business accounts`}
          label="Jobs"
          value={formatNumber(overview.stats.jobs)}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold tracking-tight text-slate-900">Judge Status</h2>
            <div className="mt-5 grid gap-3">
              {verdictCodes.map((code) => (
                <ProgressRow
                  count={overview.verdict_counts[code] ?? 0}
                  key={code}
                  label={code}
                  max={maxVerdictCount}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold tracking-tight text-slate-900">Your Progress</h2>
            {overview.user_progress ? (
              <div className="mt-4 grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-600">Solved</span>
                  <span className="font-mono font-semibold text-emerald-700">
                    {overview.user_progress.solved_count}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-600">Attempted</span>
                  <span className="font-mono font-semibold text-amber-700">
                    {overview.user_progress.attempted_count}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-600">Submissions</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {overview.user_progress.submissions_count}
                  </span>
                </div>
                <Link className="mt-2 text-sm font-medium text-blue-600 hover:underline" href="/problems">
                  Continue solving
                </Link>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-sm text-slate-600">Log in to see solved problems, attempts, and recent runs.</p>
                <Link
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  href="/login"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b bg-slate-50 px-5 py-4">
              <h2 className="text-base font-semibold tracking-tight text-slate-900">Recent Submissions</h2>
              <Link className="text-sm font-medium text-blue-600 hover:underline" href="/submissions">
                View all
              </Link>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-slate-700">
                <tr className="border-b">
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Time</th>
                  <th className="px-4 py-3 font-semibold">Problem</th>
                  <th className="px-4 py-3 font-semibold">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {overview.recent_submissions.map((submission) => (
                  <tr className="bg-white" key={submission.id}>
                    <td className="px-4 py-3 font-mono">
                      <Link className="text-blue-600 hover:underline" href={`/submission/${submission.id}`}>
                        {submission.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <LocalTime value={submission.send_time} />
                    </td>
                    <td className="px-4 py-3">
                      <Link className="font-medium text-slate-900 hover:underline" href={`/problem/${submission.problem_id}`}>
                        {submission.problem_title}
                      </Link>
                      <div className="text-xs text-slate-500">{submission.username}</div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill verdict={submission.verdict} />
                    </td>
                  </tr>
                ))}
                {overview.recent_submissions.length === 0 ? (
                  <tr className="bg-white">
                    <td className="px-4 py-10 text-center text-slate-600" colSpan={4}>
                      No submissions yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold tracking-tight text-slate-900">Featured Categories</h2>
            <Link className="text-sm font-medium text-blue-600 hover:underline" href="/problems">
              Browse
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {overview.featured_categories.map((category) => (
              <Link
                className="flex items-center gap-3 rounded-xl border bg-slate-50 p-3 hover:bg-white"
                href={`/problems/${encodeURIComponent(category.short_name)}`}
                key={category.id}
              >
                <img alt="" className="h-12 w-12 rounded-lg border bg-white object-contain p-2" src={`/${category.img_url}`} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900">{category.long_name}</div>
                  <div className="text-xs text-slate-600">{formatNumber(category.problem_count)} problems</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold tracking-tight text-slate-900">Fresh Jobs</h2>
            <Link className="text-sm font-medium text-blue-600 hover:underline" href="/jobs">
              Browse
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {overview.recent_jobs.map((job) => (
              <Link className="rounded-xl border p-4 hover:bg-slate-50" href={`/job/${job.id}`} key={job.id}>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="font-semibold tracking-tight text-slate-900">{job.title}</div>
                  <div className="text-sm text-slate-600">{formatSalaryRange(job.salary_range)}</div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span>{job.location}</span>
                  <span>·</span>
                  <span>{job.username}</span>
                  <span>·</span>
                  <LocalTime value={job.created_at} mode="date" />
                </div>
              </Link>
            ))}
            {overview.recent_jobs.length === 0 ? (
              <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">No jobs posted yet.</div>
            ) : null}
          </div>
        </div>
      </div>
    </Container>
  );
}
