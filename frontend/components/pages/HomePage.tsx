import Container from "@/components/Container";
import { backendFetchJson } from "@/lib/backend.server";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { OverviewResponse } from "@/lib/types";
import Link from "next/link";

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="card-surface rounded-2xl p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
      <p className="mt-1 text-xs text-slate-600">{hint}</p>
    </div>
  );
}

export default async function HomePage() {
  const overview = await backendFetchJson<OverviewResponse>("/api/overview/");
  const viewer = overview.viewer;

  return (
    <Container className="py-10">
      <section className="card-surface grid-fade lift-in overflow-hidden rounded-3xl p-6 md:p-9">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#9eb0c5] bg-[#eef3f8] px-3 py-1 text-xs font-semibold text-[#304765]">
              Competitive Coding + Technical Hiring
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              One place to practice hard problems and find engineering opportunities.
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-700 md:text-base">
              WnSOJ blends algorithm training, real-time judging, and a built-in jobs board for companies and candidates.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="inline-flex items-center justify-center rounded-full bg-[#304765] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#25374e]"
                href={viewer ? "/dashboard" : "/register"}
              >
                {viewer ? "Open Dashboard" : "Create Free Account"}
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                href="/problems"
              >
                Explore Problems
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                href="/jobs"
              >
                Browse Jobs
              </Link>
            </div>
          </div>

          <div className="grid w-full max-w-md gap-3">
            <div className="card-soft rounded-2xl p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Platform Pulse</div>
              <div className="mt-2 text-sm text-slate-700">
                {formatNumber(overview.platform.pending_submissions)} queued submissions, {overview.platform.acceptance_rate.toFixed(1)}% acceptance rate.
              </div>
            </div>
            <div className="card-soft rounded-2xl p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Now Active</div>
              <div className="mt-2 text-sm text-slate-700">
                {overview.recent_submissions.length} recent submissions and {overview.recent_jobs.length} new jobs in the latest feed.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stagger-in mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          hint="Total archived tasks"
          label="Problems"
          value={formatNumber(overview.platform.problems)}
        />
        <MetricCard
          hint="Submitted solutions"
          label="Submissions"
          value={formatNumber(overview.platform.submissions)}
        />
        <MetricCard hint="Community members" label="Users" value={formatNumber(overview.platform.users)} />
        <MetricCard hint="Open role posts" label="Jobs" value={formatNumber(overview.platform.jobs)} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="card-surface rounded-3xl p-6 lg:col-span-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Trending Categories</h2>
            <Link className="text-sm font-medium text-[#304765] hover:underline" href="/problems">
              View all
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {overview.trending_categories.map((category) => (
              <Link
                className="group flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/80 p-3 hover:border-[#9eb0c5] hover:bg-[#eef3f8]/50"
                href={`/problems/${encodeURIComponent(category.short_name)}`}
                key={category.id}
              >
                <div className="flex items-center gap-3">
                  <img alt={category.long_name} className="h-10 w-10 rounded-xl border bg-white p-1.5" src={`/${category.img_url}`} />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{category.long_name}</div>
                    <div className="text-xs text-slate-500">{formatNumber(category.problem_count)} problems</div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#304765] opacity-0 transition group-hover:opacity-100">Open</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card-surface rounded-3xl p-6 lg:col-span-7">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Recent Submissions</h2>
            <Link className="text-sm font-medium text-[#304765] hover:underline" href="/submissions">
              Live feed
            </Link>
          </div>
          <div className="mt-4 grid gap-2">
            {overview.recent_submissions.map((submission) => (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2" key={submission.id}>
                <div className="min-w-0">
                  <Link className="truncate text-sm font-semibold text-slate-900 hover:text-[#304765]" href={`/problem/${submission.problem_id}`}>
                    {submission.problem_title}
                  </Link>
                  <div className="text-xs text-slate-500">
                    by <Link className="hover:text-slate-700" href={`/profile/${encodeURIComponent(submission.username)}`}>{submission.username}</Link>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-700">{submission.verdict || "-"}</div>
                  <div className="text-xs text-slate-500">{formatDateTime(submission.send_time)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card-surface rounded-3xl p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Fresh Job Posts</h2>
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
                <div className="text-xs text-slate-500">
                  {job.location} · by <Link className="hover:text-slate-700" href={`/profile/${encodeURIComponent(job.username)}`}>{job.username}</Link>
                </div>
              </div>
            ))}
            {overview.recent_jobs.length === 0 ? <p className="text-sm text-slate-600">No recent jobs yet.</p> : null}
          </div>
        </div>

        <div className="card-surface rounded-3xl p-6">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">{viewer ? "Recommended for You" : "Get More from WnSOJ"}</h2>
          {viewer ? (
            <>
              <p className="mt-1 text-sm text-slate-600">
                {viewer.username}, here are high-impact unsolved problems based on community solve counts.
              </p>
              <div className="mt-4 grid gap-2">
                {viewer.recommended_problems.slice(0, 5).map((problem) => (
                  <Link
                    className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm hover:border-[#9eb0c5] hover:bg-[#eef3f8]/50"
                    href={`/problem/${problem.id}`}
                    key={problem.id}
                  >
                    <div className="font-semibold text-slate-900">{problem.title}</div>
                    <div className="text-xs text-slate-500">
                      {formatNumber(problem.solved_count)} solved · {problem.time_limit}s / {problem.memory_limit}MB
                    </div>
                  </Link>
                ))}
                {viewer.recommended_problems.length === 0 ? (
                  <p className="text-sm text-slate-600">You solved the currently popular tasks. Nice work.</p>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-slate-600">Create an account to track your verdict stats, queue status, and personalized problem recommendations.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link className="inline-flex rounded-full bg-[#304765] px-4 py-2 text-sm font-semibold text-white hover:bg-[#25374e]" href="/register">
                  Register
                </Link>
                <Link className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" href="/login">
                  Login
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </Container>
  );
}
