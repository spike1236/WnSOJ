import Container from "@/components/Container";
import { backendFetchJson } from "@/lib/backend.server";
import { asArray } from "@/lib/apiList";
import { formatNumber } from "@/lib/format";
import type { ApiList, Category } from "@/lib/types";
import Link from "next/link";

export const metadata = {
  title: "Problems"
};

export default async function Page({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const query = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const categories = asArray(
    await backendFetchJson<ApiList<Category>>("/api/categories/?limit=1000", {
      forwardCookies: false,
      revalidate: 3600
    })
  );

  const filtered = query
    ? categories.filter((cat) => {
        const hay = `${cat.long_name} ${cat.short_name}`.toLowerCase();
        return hay.includes(query);
      })
    : categories;

  return (
    <Container className="py-10">
      <section className="card-surface lift-in rounded-3xl p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Problem Categories</h1>
            <p className="mt-2 text-sm text-slate-600">Choose a track and open its full set of tasks.</p>
          </div>
          <form action="/problems" className="flex w-full max-w-sm items-center gap-2" method="GET">
            <input
              className="h-11 w-full rounded-full border border-slate-300 bg-white px-4 text-sm outline-none ring-[#304765] focus:ring-2"
              defaultValue={query}
              name="q"
              placeholder="Search categories"
              type="text"
            />
            <button className="h-11 rounded-full bg-[#304765] px-4 text-sm font-semibold text-white hover:bg-[#25374e]" type="submit">
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="stagger-in mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((cat) => (
          <Link
            className="card-surface group overflow-hidden rounded-3xl transition hover:-translate-y-0.5"
            href={`/problems/${encodeURIComponent(cat.short_name)}`}
            key={cat.id}
          >
            <div className="grid-fade border-b border-slate-200/70 p-5">
              <img alt={cat.long_name} className="mx-auto h-28 w-auto transition group-hover:scale-[1.03]" src={`/${cat.img_url}`} />
            </div>
            <div className="p-5">
              <div className="text-base font-semibold tracking-tight text-slate-900">{cat.long_name}</div>
              <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">/{cat.short_name}</div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-600">{formatNumber(cat.problem_count ?? 0)} problems</span>
                <span className="rounded-full bg-[#eef3f8] px-3 py-1 text-xs font-semibold text-[#304765]">Open</span>
              </div>
            </div>
          </Link>
        ))}
      </section>

      {filtered.length === 0 ? (
        <div className="card-surface mt-6 rounded-2xl p-6 text-sm text-slate-700">No categories found for your query.</div>
      ) : null}
    </Container>
  );
}
