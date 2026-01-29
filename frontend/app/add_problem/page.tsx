import Container from "@/components/Container";
import CodeMirrorField from "@/components/CodeMirrorField";
import MarkdownEditor from "@/components/MarkdownEditor";
import { createProblemAction } from "@/app/actions/problems";
import { backendFetchJson } from "@/lib/backend.server";
import type { ApiList, Category, UserDetail } from "@/lib/types";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Add Problem"
};

function asArray<T>(data: ApiList<T>): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

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
      <Container className="py-10">
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Add Problem</h1>
          <p className="mt-2 text-slate-600">Admin access required.</p>
          <div className="mt-6">
            <Link className="text-sm font-medium text-blue-600 hover:underline" href="/problems">
              Back to Problems
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  const categories = asArray(await backendFetchJson<ApiList<Category>>("/api/categories/?limit=1000"));

  return (
    <Container className="py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Add Problem</h1>
          <p className="mt-1 text-slate-600">Create a new problem with test data (zip).</p>
        </div>
        <Link className="text-sm font-medium text-blue-600 hover:underline" href="/problems">
          Back to Problems
        </Link>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
        <form action={createProblemAction} className="grid gap-4">
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="time_limit">
                Time limit (sec)
              </label>
              <input
                className="h-11 rounded-lg border px-3 text-sm outline-none ring-blue-600 focus:ring-2"
                id="time_limit"
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
                className="h-11 rounded-lg border px-3 text-sm outline-none ring-blue-600 focus:ring-2"
                id="memory_limit"
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
                  <label className="flex items-center gap-2 rounded-xl border bg-slate-50 px-3 py-2 text-sm" key={c.id}>
                    <input className="h-4 w-4 rounded border" name="categories" type="checkbox" value={c.id} />
                    <span className="text-slate-800">{c.long_name}</span>
                  </label>
                ))}
            </div>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-slate-700">Statement</label>
            <div>
              <MarkdownEditor height="360px" name="statement" />
            </div>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-slate-700">Editorial</label>
            <div>
              <MarkdownEditor height="360px" name="editorial" />
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
              className="h-11 rounded-lg border bg-white px-3 py-2 text-sm outline-none ring-blue-600 focus:ring-2"
              id="test_data"
              name="test_data"
              required
              type="file"
            />
          </div>

          <div className="flex justify-end">
            <button
              className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700"
              type="submit"
            >
              Create Problem
            </button>
          </div>
        </form>
      </div>
    </Container>
  );
}
