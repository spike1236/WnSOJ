import Container from "@/components/Container";
import Markdown from "@/components/Markdown";
import { deleteJobAction } from "@/app/actions/jobs";
import { backendFetchJson } from "@/lib/backend.server";
import { formatDateTime, formatSalaryRange } from "@/lib/format";
import type { Job, UserDetail } from "@/lib/types";
import Link from "next/link";

async function currentUser() {
  try {
    return await backendFetchJson<UserDetail>("/api/profile/");
  } catch {
    return null;
  }
}

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { jobId } = await params;
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;
  const job = await backendFetchJson<Job>(`/api/jobs/${encodeURIComponent(jobId)}/`);
  const user = await currentUser();
  const canEdit = user ? user.username === job.user.username || user.is_staff : false;

  return (
    <Container className="py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{job.title}</h1>
          <p className="mt-1 text-slate-600">Job details</p>
        </div>
        <Link className="text-sm font-medium text-blue-600 hover:underline" href="/jobs">
          Back to Jobs
        </Link>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {canEdit ? (
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            href={`/job/${job.id}/edit`}
          >
            Edit
          </Link>
          <form action={deleteJobAction}>
            <input name="job_id" type="hidden" value={job.id} />
            <button
              className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
              type="submit"
            >
              Delete
            </button>
          </form>
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs font-semibold text-slate-600">Location</div>
            <div className="mt-1 text-slate-900">{job.location}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600">Salary Range</div>
            <div className="mt-1 text-slate-900">{formatSalaryRange(job.salary_range)}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600">Posted By</div>
            <div className="mt-1">
              <Link className="text-blue-600 hover:underline" href={`/profile/${encodeURIComponent(job.user.username)}`}>
                {job.user.username}
              </Link>
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600">Posted On</div>
            <div className="mt-1 text-slate-900">{formatDateTime(job.created_at)}</div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Job Description</h2>
        <div className="mt-4">
          <Markdown content={job.info} />
        </div>
      </div>
    </Container>
  );
}
