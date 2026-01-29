import Container from "@/components/Container";
import MarkdownEditor from "@/components/MarkdownEditor";
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
      <Container className="py-10">
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Post a Job</h1>
          <p className="mt-2 text-slate-600">Only business accounts can post job listings.</p>
          <div className="mt-6">
            <Link className="text-sm font-medium text-blue-600 hover:underline" href="/edit_profile">
              Switch to business account
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Post a Job</h1>
          <p className="mt-1 text-slate-600">Markdown is supported in the description.</p>
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

      <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
        <form action={createJobAction} className="grid gap-4">
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-slate-700" htmlFor="title">
              Title
            </label>
            <input
              className="h-11 rounded-lg border px-3 text-sm outline-none ring-blue-600 focus:ring-2"
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
                  className="h-11 rounded-lg border px-3 text-sm outline-none ring-blue-600 focus:ring-2"
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
                  className="h-11 rounded-lg border bg-white px-3 text-sm outline-none ring-blue-600 focus:ring-2"
                  defaultValue="$"
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
              <MarkdownEditor height="360px" name="info" required />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700"
              type="submit"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </Container>
  );
}
