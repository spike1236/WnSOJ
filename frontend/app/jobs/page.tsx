import Container from "@/components/Container";
import LocalTime from "@/components/LocalTime";
import Markdown from "@/components/Markdown";
import { Badge, EmptyState, PageHeader } from "@/components/PageShell";
import { backendFetchJson } from "@/lib/backend.server";
import { asArray } from "@/lib/apiList";
import { formatSalaryRange } from "@/lib/format";
import type { ApiList, Job, UserDetail } from "@/lib/types";
import Link from "next/link";

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
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const user = await currentUser();

  const qs = new URLSearchParams();
  qs.set("limit", "50");
  if (author) qs.set("author", author);
  if (q) qs.set("q", q);
  const jobs = asArray(await backendFetchJson<ApiList<Job>>(`/api/jobs/?${qs.toString()}`));

  return (
    <Container className="py-8 sm:py-10">
      <PageHeader
        actions={
          user?.is_business ? (
            <Link className="action-primary" href="/add_job">
              Post Job
            </Link>
          ) : null
        }
        description={author ? `Roles posted by ${author}.` : "Programming and engineering opportunities from the community."}
        kicker="Careers"
        title="Job Board"
      />

      <form action="/jobs" className="surface mt-6 grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        {author ? <input name="author" type="hidden" value={author} /> : null}
        <label className="sr-only" htmlFor="job-search">
          Search jobs
        </label>
        <input
          className="input-modern"
          defaultValue={q}
          id="job-search"
          maxLength={100}
          name="q"
          placeholder="Search title, location, company, or description"
          type="search"
        />
        <div className="flex gap-2">
          <button className="action-primary" type="submit">
            Search
          </button>
          {q || author ? (
            <Link className="action-link" href="/jobs">
              Clear
            </Link>
          ) : null}
        </div>
      </form>

      <div className="mt-6 grid gap-4">
        {jobs.map((job) => (
          <article className="surface overflow-hidden transition hover:border-blue-200 hover:shadow-lg" key={job.id}>
            <div className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="blue">{job.location}</Badge>
                  <Badge tone="emerald">{formatSalaryRange(job.salary_range)}</Badge>
                </div>
                <Link className="mt-3 block text-xl font-bold tracking-normal text-slate-950 hover:text-blue-700" href={`/job/${job.id}`}>
                  {job.title}
                </Link>
              </div>
              <div className="flex items-start md:justify-end">
                <Link className="action-link" href={`/job/${job.id}`}>
                  Details
                </Link>
              </div>
            </div>
            <div className="border-t bg-slate-50/60 p-5">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span>
                  Posted by{" "}
                  <Link className="font-semibold text-blue-600 hover:text-blue-700" href={`/profile/${encodeURIComponent(job.user.username)}`}>
                    {job.user.username}
                  </Link>
                </span>
                <span className="text-slate-300">/</span>
                <LocalTime value={job.created_at} mode="date" />
              </div>
              <div className="relative mt-4 max-h-28 overflow-hidden">
                <Markdown content={job.info} />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-slate-50" />
              </div>
            </div>
          </article>
        ))}
        {jobs.length === 0 ? (
          <EmptyState
            action={
              <Link className="action-link" href="/jobs">
                All jobs
              </Link>
            }
            description={q ? `No listings matched "${q}".` : author ? "This user has not posted any visible listings." : "There are no visible listings right now."}
            title="No jobs found"
          />
        ) : null}
      </div>
    </Container>
  );
}
