import Container from "@/components/Container";
import { PageHeader } from "@/components/PageShell";
import { backendFetchJson } from "@/lib/backend.server";
import { asArray } from "@/lib/apiList";
import type { ApiList, Category, UserDetail } from "@/lib/types";
import Link from "next/link";

export const metadata = {
  title: "Problems"
};

export default async function Page() {
  const [categoryList, user] = await Promise.all([
    backendFetchJson<ApiList<Category>>("/api/categories/?limit=1000", {
      forwardCookies: false,
      revalidate: 3600
    }),
    backendFetchJson<UserDetail>("/api/profile/").catch(() => null)
  ]);
  const categories = asArray(categoryList);

  return (
    <Container className="py-8 sm:py-10">
      <PageHeader
        actions={
          user?.is_staff ? (
            <Link className="action-primary" href="/add_problem">
              Add Problem
            </Link>
          ) : null
        }
        description="Choose a topic, scan the limits, and jump straight into solving."
        kicker="Problemset"
        title="Practice by Category"
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <Link
            className="surface group overflow-hidden transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
            href={`/problems/${encodeURIComponent(cat.short_name)}`}
            key={cat.id}
          >
            <div className="grid h-36 place-items-center border-b bg-slate-50 p-6">
              <img alt={cat.long_name} className="h-24 w-auto transition duration-200 group-hover:scale-[1.04]" src={`/${cat.img_url}`} />
            </div>
            <div className="flex items-center justify-between gap-4 p-5">
              <div>
                <div className="text-base font-bold tracking-normal text-slate-950">{cat.long_name}</div>
              </div>
              <div className="rounded-full border bg-white px-3 py-1 text-xs font-bold text-blue-600">Open</div>
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}
