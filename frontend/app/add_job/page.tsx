import Container from "@/components/Container";
import MarkdownEditor from "@/components/MarkdownEditor";
import { PageHeader, SectionPanel } from "@/components/PageShell";
import { createJobAction } from "@/app/actions/jobs";
import { backendFetchJson } from "@/lib/backend.server";
import type { UserDetail } from "@/lib/types";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Add Job"
};

export default async function Page({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;
  let user: UserDetail | null = null;
  try {
    user = await backendFetchJson<UserDetail>("/api/profile/");
  } catch {
    redirect("/login?error=Login%20required");
  }

  if (!user.is_business) {
    return (
      <Container className="py-8 sm:py-10">
        <div className="surface p-8">
          <h1 className="text-2xl font-bold tracking-normal text-slate-950">Post a Job</h1>
          <p className="mt-2 text-slate-600">Only business accounts can post job listings.</p>
          <div className="mt-6">
            <Link className="action-link" href="/edit_profile">
              Switch to business account
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8 sm:py-10">
      <PageHeader
        actions={
          <Link className="action-link" href="/jobs">
            Jobs
          </Link>
        }
        description="Create a visible listing for the community job board."
        kicker="Careers"
        title="Post a Job"
      />

      {error ? (
        <div className="mt-6 rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <SectionPanel className="mt-6" title="Listing Details">
        <form action={createJobAction} className="grid gap-5 p-5 sm:p-6">
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-slate-700" htmlFor="title">
              Title
            </label>
            <input
              className="input-modern"
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
                  id="min_salary"
                  min={0}
                  name="min_salary"
                  placeholder="0"
                  type="number"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-slate-600" htmlFor="max_salary">
                  Maximum
                </label>
                <input
                  className="input-modern"
                  id="max_salary"
                  min={0}
                  name="max_salary"
                  placeholder="Leave empty for no upper limit"
                  type="number"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-slate-600" htmlFor="currency">
                  Currency
                </label>
                <select
                  className="input-modern"
                  defaultValue="$"
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
              <MarkdownEditor height="360px" name="info" required />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              className="action-primary"
              type="submit"
            >
              Submit
            </button>
          </div>
        </form>
      </SectionPanel>
    </Container>
  );
}
