import Container from "@/components/Container";
import MarkdownEditor from "@/components/MarkdownEditor";
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
    <Container className="py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Job</h1>
          <p className="mt-1 text-slate-600">{job.title}</p>
        </div>
        <Link className="text-sm font-medium text-blue-600 hover:underline" href={`/job/${job.id}`}>
          Cancel
        </Link>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
        <form action={updateJobAction} className="grid gap-4">
          <input name="job_id" type="hidden" value={job.id} />
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-slate-700" htmlFor="title">
              Title
            </label>
            <input
              className="h-11 rounded-lg border px-3 text-sm outline-none ring-blue-600 focus:ring-2"
              defaultValue={job.title}
              id="title"
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
              className="h-11 rounded-lg border px-3 text-sm outline-none ring-blue-600 focus:ring-2"
              defaultValue={job.location}
              id="location"
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
                  className="h-11 rounded-lg border px-3 text-sm outline-none ring-blue-600 focus:ring-2"
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
                  className="h-11 rounded-lg border px-3 text-sm outline-none ring-blue-600 focus:ring-2"
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
                  className="h-11 rounded-lg border bg-white px-3 text-sm outline-none ring-blue-600 focus:ring-2"
                  defaultValue={currency}
                  id="currency"
                  name="currency"
                >
                  <option value="$">USD ($)</option>
                </select>
              </div>
            </div>
            <div className="text-xs text-slate-500">All salary fields are optional.</div>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <div>
              <MarkdownEditor defaultValue={job.info} height="360px" name="info" />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700"
              type="submit"
            >
              Save Changes
            </button>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-lg border px-5 text-sm font-medium hover:bg-slate-50"
              href={`/job/${job.id}`}
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </Container>
  );
}
