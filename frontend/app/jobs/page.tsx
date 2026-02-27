import Container from "@/components/Container";
import LocalTime from "@/components/LocalTime";
import Markdown from "@/components/Markdown";
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
  const author = typeof sp.author === "string" ? sp.author.trim() : "";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const location = typeof sp.location === "string" ? sp.location.trim() : "";

  const user = await currentUser();

  const qs = new URLSearchParams();
  qs.set("limit", "50");
  if (author) qs.set("author", author);
  if (q) qs.set("q", q);
  if (location) qs.set("location", location);

  const jobs = asArray(await backendFetchJson<ApiList<Job>>(`/api/jobs/?${qs.toString()}`));

  return (
    <Container className="py-10">
      <section className="card-surface lift-in rounded-3xl p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Job Listings</h1>
            <p className="mt-2 text-sm text-slate-600">
              {author ? `Filtered by employer: ${author}` : "Find opportunities across locations and teams."}
            </p>
          </div>
          {user?.is_business ? (
            <Link className="inline-flex items-center justify-center rounded-full bg-[#304765] px-4 py-2 text-sm font-semibold text-white hover:bg-[#25374e]" href="/add_job">
              Post a New Job
            </Link>
          ) : null}
        </div>

        <form action="/jobs" className="mt-4 grid gap-3 md:grid-cols-[1fr_220px_auto]" method="GET">
          {author ? <input name="author" type="hidden" value={author} /> : null}
          <input
            className="h-11 rounded-full border border-slate-300 bg-white px-4 text-sm outline-none ring-[#304765] focus:ring-2"
            defaultValue={q}
            name="q"
            placeholder="Search title or description"
            type="text"
          />
          <input
            className="h-11 rounded-full border border-slate-300 bg-white px-4 text-sm outline-none ring-[#304765] focus:ring-2"
            defaultValue={location}
            name="location"
            placeholder="Location"
            type="text"
          />
          <button className="h-11 rounded-full bg-[#304765] px-5 text-sm font-semibold text-white hover:bg-[#25374e]" type="submit">
            Apply
          </button>
        </form>
      </section>

      <section className="stagger-in mt-6 grid gap-4">
        {jobs.map((job) => (
          <article className="card-surface overflow-hidden rounded-3xl" key={job.id}>
            <div className="flex flex-col gap-2 border-b border-slate-200/70 bg-slate-100/40 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">{job.title}</h2>
                <div className="mt-1 text-sm text-slate-600">{job.location}</div>
              </div>
              <div className="rounded-full bg-[#eef3f8] px-3 py-1 text-sm font-semibold text-[#304765]">{formatSalaryRange(job.salary_range)}</div>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span>
                  Posted by{" "}
                  <Link className="font-medium text-[#304765] hover:underline" href={`/profile/${encodeURIComponent(job.user.username)}`}>
                    {job.user.username}
                  </Link>
                </span>
                <span>•</span>
                <span>
                  <LocalTime mode="date" value={job.created_at} />
                </span>
              </div>
              <div className="relative mt-4 max-h-36 overflow-hidden rounded-xl border border-slate-200/80 bg-white/70 p-4">
                <Markdown content={job.info} />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-white/95" />
              </div>
              <div className="mt-4">
                <Link className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" href={`/job/${job.id}`}>
                  View Details
                </Link>
              </div>
            </div>
          </article>
        ))}
        {jobs.length === 0 ? <div className="card-surface rounded-2xl p-6 text-slate-700">No jobs match your current filters.</div> : null}
      </section>
    </Container>
  );
}
