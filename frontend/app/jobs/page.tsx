import Container from "@/components/Container";
import Markdown from "@/components/Markdown";
import { backendFetchJson } from "@/lib/backend.server";
import { formatDate, formatSalaryRange } from "@/lib/format";
import type { ApiList, Job, UserDetail } from "@/lib/types";
import Link from "next/link";

function asArray<T>(data: ApiList<T>): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

async function currentUser() {
  try {
    return await backendFetchJson<UserDetail>("/api/profile/");
  } catch {
    return null;
  }
}

export const metadata = {
  title: "Jobs"
};

export default async function Page({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const author = typeof sp.author === "string" ? sp.author : null;
  const user = await currentUser();
  const jobs = asArray(await backendFetchJson<ApiList<Job>>("/api/jobs/?limit=50"));
  const filtered = author ? jobs.filter((j) => j.user.username === author) : jobs;

  return (
    <Container className="py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Job Listings</h1>
          <p className="mt-1 text-slate-600">{author ? `Posted by ${author}` : "Find your next opportunity."}</p>
        </div>
        {user?.is_business ? (
          <Link
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            href="/add_job"
          >
            Post a New Job
          </Link>
        ) : null}
      </div>

      <div className="mt-6 grid gap-5">
        {filtered.map((job) => (
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm" key={job.id}>
            <div className="flex flex-col gap-2 border-b bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-lg font-semibold tracking-tight text-slate-900">{job.title}</div>
              <div className="text-sm text-slate-600">{formatSalaryRange(job.salary_range)}</div>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span className="rounded-full border bg-slate-50 px-3 py-1">{job.location}</span>
                <span>
                  Posted by{" "}
                  <Link className="text-blue-600 hover:underline" href={`/profile/${encodeURIComponent(job.user.username)}`}>
                    {job.user.username}
                  </Link>
                </span>
                <span>·</span>
                <span>{formatDate(job.created_at)}</span>
              </div>
              <div className="relative mt-4 max-h-32 overflow-hidden">
                <Markdown content={job.info} />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-white" />
              </div>
              <div className="mt-4">
                <Link
                  className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
                  href={`/job/${job.id}`}
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border bg-slate-50 p-6 text-slate-700">No jobs available.</div>
        ) : null}
      </div>
    </Container>
  );
}
