import Container from "@/components/Container";
import CodeMirrorField from "@/components/CodeMirrorField";
import MarkdownEditor from "@/components/MarkdownEditor";
import { PageHeader, SectionPanel } from "@/components/PageShell";
import { createProblemAction } from "@/app/actions/problems";
import { backendFetchJson } from "@/lib/backend.server";
import { asArray } from "@/lib/apiList";
import type { ApiList, Category, UserDetail } from "@/lib/types";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Add Problem"
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

  if (!user.is_staff) {
    return (
      <Container className="py-8 sm:py-10">
        <div className="surface p-8">
          <h1 className="text-2xl font-bold tracking-normal text-slate-950">Add Problem</h1>
          <p className="mt-2 text-slate-600">Admin access required.</p>
          <div className="mt-6">
            <Link className="action-link" href="/problems">
              Problems
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  const categories = asArray(await backendFetchJson<ApiList<Category>>("/api/categories/?limit=1000"));

  return (
    <Container className="py-8 sm:py-10">
      <PageHeader
        actions={
          <Link className="action-link" href="/problems">
            Problems
          </Link>
        }
        description="Create a public challenge, editorial, reference solution, and test archive."
        kicker="Admin"
        title="Add Problem"
      />

      {error ? (
        <div className="mt-6 rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
      ) : null}

      <SectionPanel className="mt-6" title="Problem Details">
        <form action={createProblemAction} className="grid gap-5 p-5 sm:p-6">
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="time_limit">
                Time limit (sec)
              </label>
              <input
                className="input-modern"
                id="time_limit"
                min="0.1"
                name="time_limit"
                required
                step="0.1"
                type="number"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="memory_limit">
                Memory limit (MB)
              </label>
              <input
                className="input-modern"
                id="memory_limit"
                min="1"
                name="memory_limit"
                required
                type="number"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <div className="text-sm font-medium text-slate-700">Categories</div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {categories
                .filter((c) => c.short_name !== "problemset")
                .map((c) => (
                  <label className="flex items-center gap-2 rounded-[8px] border bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800" key={c.id}>
                    <input className="h-4 w-4 rounded border" name="categories" type="checkbox" value={c.id} />
                    <span>{c.long_name}</span>
                  </label>
                ))}
            </div>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-slate-700">Statement</label>
            <div>
              <MarkdownEditor height="360px" name="statement" required />
            </div>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-slate-700">Editorial</label>
            <div>
              <MarkdownEditor height="360px" name="editorial" required />
            </div>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-slate-700">Official solution code</label>
            <div>
              <CodeMirrorField height="280px" language="cpp" name="code" />
            </div>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-slate-700" htmlFor="test_data">
              Test data (zip)
            </label>
            <input
              accept=".zip,application/zip,application/x-zip-compressed"
              className="h-11 rounded-[8px] border bg-white px-3 py-2 text-sm outline-none ring-blue-600 focus:ring-2"
              id="test_data"
              name="test_data"
              required
              type="file"
            />
          </div>

          <div className="flex justify-end">
            <button
              className="action-primary"
              type="submit"
            >
              Create Problem
            </button>
          </div>
        </form>
      </SectionPanel>
    </Container>
  );
}
