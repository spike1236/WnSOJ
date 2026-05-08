import Container from "@/components/Container";
import MarkdownEditor from "@/components/MarkdownEditor";
import { PageHeader, SectionPanel } from "@/components/PageShell";
import { updateJobAction } from "@/app/actions/jobs";
import { backendFetchJson } from "@/lib/backend.server";
import type { Job, UserDetail } from "@/lib/types";
import Link from "next/link";
import { redirect } from "next/navigation";

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

  let user: UserDetail | null = null;
  try {
    user = await backendFetchJson<UserDetail>("/api/profile/");
  } catch {
    redirect("/login?error=Login%20required");
  }

  const job = await backendFetchJson<Job>(`/api/jobs/${encodeURIComponent(jobId)}/`);
  if (user.username !== job.user.username && !user.is_staff) {
    redirect(`/job/${job.id}?error=${encodeURIComponent("Not authorized")}`);
  }
  const minSalary = job.salary_range?.min ?? 0;
  const maxSalary = job.salary_range?.max ?? "";
  const currency = job.salary_range?.currency ?? "$";

  return (
    <Container className="py-8 sm:py-10">
      <PageHeader
        actions={
          <Link className="action-link" href={`/job/${job.id}`}>
            Cancel
          </Link>
        }
        description={job.title}
        kicker="Careers"
        title="Edit Job"
      />

      {error ? (
        <div className="mt-6 rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <SectionPanel className="mt-6" title="Listing Details">
        <form action={updateJobAction} className="grid gap-5 p-5 sm:p-6">
          <input name="job_id" type="hidden" value={job.id} />
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-slate-700" htmlFor="title">
              Title
            </label>
            <input
              className="input-modern"
              defaultValue={job.title}
              id="title"
              maxLength={200}
              name="title"
              required
              type="text"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-slate-700" htmlFor="location">
              Location
            </label>
            <input
              className="input-modern"
              defaultValue={job.location}
              id="location"
              maxLength={200}
              name="location"
              required
              type="text"
            />
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-medium text-slate-700">Salary Range (optional)</div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-slate-600" htmlFor="min_salary">
                  Minimum
                </label>
                <input
                  className="input-modern"
                  defaultValue={String(minSalary)}
                  id="min_salary"
                  min={0}
                  name="min_salary"
                  type="number"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-slate-600" htmlFor="max_salary">
                  Maximum
                </label>
                <input
                  className="input-modern"
                  defaultValue={String(maxSalary)}
                  id="max_salary"
                  min={0}
                  name="max_salary"
                  type="number"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-slate-600" htmlFor="currency">
                  Currency
                </label>
                <select
                  className="input-modern"
                  defaultValue={currency}
                  id="currency"
                  name="currency"
                >
                  <option value="$">USD ($)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <div>
              <MarkdownEditor defaultValue={job.info} height="360px" name="info" required />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              className="action-primary"
              type="submit"
            >
              Save Changes
            </button>
            <Link
              className="action-link"
              href={`/job/${job.id}`}
            >
              Cancel
            </Link>
          </div>
        </form>
      </SectionPanel>
    </Container>
  );
}
