import Container from "@/components/Container";
import { backendFetchJson } from "@/lib/backend.server";
import type { ApiList, Category } from "@/lib/types";
import Link from "next/link";

export const metadata = {
  title: "Problems"
};

function asArray<T>(data: ApiList<T>): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export default async function Page() {
  const categories = asArray(
    await backendFetchJson<ApiList<Category>>("/api/categories/?limit=1000", {
      forwardCookies: false,
      revalidate: 3600
    })
  );

  return (
    <Container className="py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Problem Categories</h1>
          <p className="mt-1 text-slate-600">Pick a topic and start solving.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <Link
            className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md"
            href={`/problems/${encodeURIComponent(cat.short_name)}`}
            key={cat.id}
          >
            <div className="bg-slate-50 p-6">
              <img alt={cat.long_name} className="mx-auto h-28 w-auto transition group-hover:scale-[1.02]" src={`/${cat.img_url}`} />
            </div>
            <div className="p-5">
              <div className="text-base font-semibold tracking-tight text-slate-900">{cat.long_name}</div>
              <div className="mt-1 text-sm text-slate-600">Open problem list</div>
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}
