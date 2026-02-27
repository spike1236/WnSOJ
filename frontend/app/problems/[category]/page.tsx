import Container from "@/components/Container";
import { backendFetchJson } from "@/lib/backend.server";
import { asArray } from "@/lib/apiList";
import type { ApiList, Category, ProblemListItem } from "@/lib/types";
import { cn } from "@/lib/cn";
import Link from "next/link";

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { category } = await params;
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const sort = typeof sp.sort === "string" ? sp.sort.trim().toLowerCase() : "";

  const categories = asArray(
    await backendFetchJson<ApiList<Category>>("/api/categories/?limit=1000", {
      forwardCookies: false,
      revalidate: 3600
    })
  );
  const categoryName = categories.find((c) => c.short_name === category)?.long_name ?? category;

  const qs = new URLSearchParams();
  qs.set("compact", "1");
  qs.set("limit", "1000");
  qs.set("category", category);
  if (q) qs.set("q", q);
  if (sort === "solved" || sort === "new") qs.set("sort", sort);

  const problems = asArray(await backendFetchJson<ApiList<ProblemListItem>>(`/api/problems/?${qs.toString()}`));

  return (
    <Container className="py-10">
      <section className="card-surface lift-in rounded-3xl p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{categoryName}</h1>
            <p className="mt-2 text-sm text-slate-600">Filter by title and sort by popularity or newest tasks.</p>
          </div>
          <Link className="text-sm font-semibold text-[#304765] hover:underline" href="/problems">
            All categories
          </Link>
        </div>
        <form action={`/problems/${encodeURIComponent(category)}`} className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_auto]" method="GET">
          <input
            className="h-11 rounded-full border border-slate-300 bg-white px-4 text-sm outline-none ring-[#304765] focus:ring-2"
            defaultValue={q}
            name="q"
            placeholder="Search by problem title"
            type="text"
          />
          <select
            className="h-11 rounded-full border border-slate-300 bg-white px-4 text-sm outline-none ring-[#304765] focus:ring-2"
            defaultValue={sort || "solved"}
            name="sort"
          >
            <option value="solved">Most solved</option>
            <option value="new">Newest first</option>
          </select>
          <button className="h-11 rounded-full bg-[#304765] px-5 text-sm font-semibold text-white hover:bg-[#25374e]" type="submit">
            Apply
          </button>
        </form>
      </section>

      <section className="card-surface mt-6 overflow-hidden rounded-3xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100/70 text-slate-700">
            <tr>
              <th className="w-24 px-4 py-3 font-semibold">ID</th>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell">Categories</th>
              <th className="w-28 px-4 py-3 font-semibold">Solved</th>
              <th className="hidden w-32 px-4 py-3 font-semibold md:table-cell">Limits</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {problems.map((p) => {
              const cats = (p.categories ?? [])
                .map((c) => c.long_name)
                .filter((name) => name.toLowerCase() !== "problemset");
              const statusClass =
                p.user_status === "solved"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : p.user_status === "attempted"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-slate-50 text-slate-700 border-slate-200";

              return (
                <tr className="bg-white/80" key={p.id}>
                  <td className="px-4 py-3 font-mono text-slate-700">{p.id}</td>
                  <td className="px-4 py-3">
                    <Link className="font-semibold text-slate-900 hover:text-[#304765]" href={`/problem/${p.id}`}>
                      {p.title}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{cats.join(", ") || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-semibold", statusClass)}>
                      {p.solved_count ?? 0}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 md:table-cell">
                    {p.time_limit}s / {p.memory_limit}MB
                  </td>
                </tr>
              );
            })}
            {problems.length === 0 ? (
              <tr className="bg-white">
                <td className="px-4 py-10 text-center text-slate-600" colSpan={5}>
                  No problems match your filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </Container>
  );
}
