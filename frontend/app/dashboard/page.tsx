import Container from "@/components/Container";
import LocalTime from "@/components/LocalTime";
import StatusPill from "@/components/StatusPill";
import { backendFetchJson } from "@/lib/backend.server";
import { formatNumber } from "@/lib/format";
import type { OverviewResponse } from "@/lib/types";
import Link from "next/link";

export const metadata = {
  title: "Dashboard"
};

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-soft rounded-2xl p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{value}</div>
    </div>
  );
}

export default async function Page() {
  const overview = await backendFetchJson<OverviewResponse>("/api/overview/");
  const viewer = overview.viewer;

  return (
    <Container className="py-10">
      <section className="card-surface lift-in rounded-3xl p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              {viewer ? `Welcome back, ${viewer.username}` : "Platform Dashboard"}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {viewer
                ? "Track your performance, review activity, and continue solving high-impact problems."
                : "Live platform overview. Sign in for personal performance and recommendations."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {viewer ? (
              <>
                <Link className="rounded-full bg-[#304765] px-4 py-2 text-sm font-semibold text-white hover:bg-[#25374e]" href="/problems">
                  Solve Problems
                </Link>
                <Link className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" href={`/submissions?username=${encodeURIComponent(viewer.username)}`}>
                  My Submissions
                </Link>
              </>
            ) : (
              <>
                <Link className="rounded-full bg-[#304765] px-4 py-2 text-sm font-semibold text-white hover:bg-[#25374e]" href="/register">
                  Register
                </Link>
                <Link className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" href="/login">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="stagger-in mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock label="Problems" value={formatNumber(overview.platform.problems)} />
        <StatBlock label="Submissions" value={formatNumber(overview.platform.submissions)} />
        <StatBlock label="Queue" value={formatNumber(overview.platform.pending_submissions)} />
        <StatBlock label="Acceptance" value={`${overview.platform.acceptance_rate.toFixed(1)}%`} />
      </section>

      {viewer ? (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatBlock label="Solved" value={formatNumber(viewer.solved_count)} />
          <StatBlock label="Attempted" value={formatNumber(viewer.attempted_count)} />
          <StatBlock label="Submitted" value={formatNumber(viewer.submission_count)} />
          <StatBlock label="In Queue" value={formatNumber(viewer.queued_count)} />
        </section>
      ) : null}

      <section className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="card-surface rounded-3xl p-6 lg:col-span-7">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              {viewer ? "Your Recent Submissions" : "Recent Submissions"}
            </h2>
            <Link className="text-sm font-medium text-[#304765] hover:underline" href="/submissions">
              View all
            </Link>
          </div>
          <div className="mt-4 grid gap-2">
            {(viewer ? viewer.recent_submissions : overview.recent_submissions).map((submission) => (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2" key={submission.id}>
                <div>
                  <Link className="text-sm font-semibold text-slate-900 hover:text-[#304765]" href={`/problem/${submission.problem_id}`}>
                    {submission.problem_title}
                  </Link>
                  <div className="text-xs text-slate-500">
                    #{submission.id} · <LocalTime value={submission.send_time} />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusPill verdict={submission.verdict} />
                  {submission.progress_label ? (
                    <span className="text-xs text-slate-500">{submission.progress_label}</span>
                  ) : null}
                </div>
              </div>
            ))}
            {(viewer ? viewer.recent_submissions : overview.recent_submissions).length === 0 ? (
              <p className="text-sm text-slate-600">No submissions available.</p>
            ) : null}
          </div>
        </div>

        <div className="card-surface rounded-3xl p-6 lg:col-span-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Recent Jobs</h2>
            <Link className="text-sm font-medium text-[#304765] hover:underline" href="/jobs">
              Open board
            </Link>
          </div>
          <div className="mt-4 grid gap-2">
            {overview.recent_jobs.map((job) => (
              <div className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2" key={job.id}>
                <Link className="text-sm font-semibold text-slate-900 hover:text-[#304765]" href={`/job/${job.id}`}>
                  {job.title}
                </Link>
                <div className="text-xs text-slate-500">{job.location} · {job.username}</div>
              </div>
            ))}
            {overview.recent_jobs.length === 0 ? <p className="text-sm text-slate-600">No jobs posted yet.</p> : null}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="card-surface rounded-3xl p-6 lg:col-span-7">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Trending Categories</h2>
            <Link className="text-sm font-medium text-[#304765] hover:underline" href="/problems">
              Explore
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {overview.trending_categories.map((category) => (
              <Link
                className="group flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/80 p-3 hover:border-[#9eb0c5] hover:bg-[#eef3f8]/50"
                href={`/problems/${encodeURIComponent(category.short_name)}`}
                key={category.id}
              >
                <div className="flex items-center gap-3">
                  <img alt={category.long_name} className="h-9 w-9 rounded-lg border bg-white p-1" src={`/${category.img_url}`} />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{category.long_name}</div>
                    <div className="text-xs text-slate-500">{formatNumber(category.problem_count)} tasks</div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#304765] opacity-0 transition group-hover:opacity-100">Open</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card-surface rounded-3xl p-6 lg:col-span-5">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            {viewer ? "Recommended Problems" : "Why Sign In"}
          </h2>
          {viewer ? (
            <div className="mt-4 grid gap-2">
              {viewer.recommended_problems.slice(0, 6).map((problem) => (
                <Link
                  className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 hover:border-[#9eb0c5] hover:bg-[#eef3f8]/50"
                  href={`/problem/${problem.id}`}
                  key={problem.id}
                >
                  <div className="text-sm font-semibold text-slate-900">{problem.title}</div>
                  <div className="text-xs text-slate-500">
                    Solved by {formatNumber(problem.solved_count)} users · {problem.time_limit}s / {problem.memory_limit}MB
                  </div>
                </Link>
              ))}
              {viewer.recommended_problems.length === 0 ? (
                <p className="text-sm text-slate-600">No recommendations right now. You are caught up.</p>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 grid gap-3 text-sm text-slate-600">
              <p>Signed-in users get personal stats, queue tracking, and recommendation ranking based on solve history.</p>
              <p>Business accounts can also publish jobs and manage listings from the same profile.</p>
            </div>
          )}
        </div>
      </section>
    </Container>
  );
}
