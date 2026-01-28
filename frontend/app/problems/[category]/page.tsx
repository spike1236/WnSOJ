import Container from "@/components/Container";
import { backendFetchJson } from "@/lib/backend.server";
import type { ApiList, Category, ProblemListItem } from "@/lib/types";
import { cn } from "@/lib/cn";
import Link from "next/link";

function asArray<T>(data: ApiList<T>): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export default async function Page({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const categories = asArray(
    await backendFetchJson<ApiList<Category>>("/api/categories/?limit=1000", {
      forwardCookies: false,
      revalidate: 3600
    })
  );
  const categoryName = categories.find((c) => c.short_name === category)?.long_name ?? category;
  const problems = asArray(
    await backendFetchJson<ApiList<ProblemListItem>>(
      `/api/problems/?compact=1&limit=1000&category=${encodeURIComponent(category)}`
    )
  );

  return (
    <Container className="py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Problem List</h1>
          <p className="mt-1 text-slate-600">Category: {categoryName}</p>
        </div>
        <Link className="text-sm font-medium text-blue-600 hover:underline" href="/problems">
          All categories
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 font-semibold w-24">ID</th>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell">Categories</th>
              <th className="px-4 py-3 font-semibold w-28">Solved</th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell w-32">Limits</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {problems.map((p) => {
              const cats = (p.categories ?? [])
                .map((c) => c.long_name)
                .filter((name) => name.toLowerCase() !== "problemset");
              const statusClass =
                p.user_status === "solved"
                  ? "bg-emerald-50 text-emerald-700"
                  : p.user_status === "attempted"
                    ? "bg-amber-50 text-amber-800"
                    : "bg-slate-50 text-slate-700";
              return (
                <tr className="bg-white" key={p.id}>
                  <td className="px-4 py-3 font-mono text-slate-700">{p.id}</td>
                  <td className="px-4 py-3">
                    <Link className="font-medium text-slate-900 hover:underline" href={`/problem/${p.id}`}>
                      {p.title}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{cats.join(", ") || "—"}</td>
                  <td className="px-4 py-3">
                    <Link
                      className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-semibold", statusClass)}
                      href={`/problem/${p.id}/submissions?verdict=AC`}
                    >
                      {p.solved_count ?? 0}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 md:table-cell">
                    {p.time_limit}s / {p.memory_limit}MB
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
