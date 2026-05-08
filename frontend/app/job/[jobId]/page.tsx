import Container from "@/components/Container";
import DeleteJobForm from "@/components/DeleteJobForm";
import LocalTime from "@/components/LocalTime";
import Markdown from "@/components/Markdown";
import { Badge, PageHeader, SectionPanel } from "@/components/PageShell";
import { deleteJobAction } from "@/app/actions/jobs";
import { backendFetchJson } from "@/lib/backend.server";
import { formatSalaryRange } from "@/lib/format";
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
  const salaryLabel = formatSalaryRange(job.salary_range);

  return (
    <Container className="py-8 sm:py-10">
      <PageHeader
        actions={
          <Link className="action-link" href="/jobs">
            Jobs
          </Link>
        }
        description={
          <>
            Posted by{" "}
            <Link className="font-semibold text-blue-600 hover:text-blue-700" href={`/profile/${encodeURIComponent(job.user.username)}`}>
              {job.user.username}
            </Link>
          </>
        }
        kicker="Job"
        title={job.title}
      />

      {error ? (
        <div className="mt-6 rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {canEdit ? (
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            className="action-primary"
            href={`/job/${job.id}/edit`}
          >
            Edit
          </Link>
          <DeleteJobForm action={deleteJobAction} jobId={job.id} />
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <SectionPanel title="Job Description">
          <div className="p-5 sm:p-6">
            <Markdown content={job.info} />
          </div>
        </SectionPanel>

        <aside className="surface h-fit p-5 lg:sticky lg:top-24">
          <div className="text-sm font-bold uppercase tracking-wide text-slate-500">Listing Snapshot</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="blue">{job.location}</Badge>
            <Badge tone={salaryLabel === "Salary not specified" ? "slate" : "emerald"}>{salaryLabel}</Badge>
          </div>
          <div className="mt-5 grid gap-3 text-sm">
            <div>
              <div className="font-bold uppercase tracking-wide text-slate-500">Posted</div>
              <div className="mt-1 text-slate-800">
                <LocalTime value={job.created_at} />
              </div>
            </div>
            <div>
              <div className="font-bold uppercase tracking-wide text-slate-500">Author</div>
              <Link className="mt-1 inline-flex font-semibold text-blue-600 hover:text-blue-700" href={`/profile/${encodeURIComponent(job.user.username)}`}>
                {job.user.username}
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </Container>
  );
}
