import Container from "@/components/Container";
import { Badge, EmptyState, PageHeader } from "@/components/PageShell";
import { backendFetchJson } from "@/lib/backend.server";
import { asArray } from "@/lib/apiList";
import type { ApiList, Category, ProblemListItem, UserDetail } from "@/lib/types";
import Link from "next/link";

export default async function Page({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const [categoryList, user] = await Promise.all([
    backendFetchJson<ApiList<Category>>("/api/categories/?limit=1000", {
      forwardCookies: false,
      revalidate: 3600
    }),
    backendFetchJson<UserDetail>("/api/profile/").catch(() => null)
  ]);
  const categories = asArray(categoryList);
  const categoryName = categories.find((c) => c.short_name === category)?.long_name ?? category;
  const problems = asArray(
    await backendFetchJson<ApiList<ProblemListItem>>(
      `/api/problems/?compact=1&limit=1000&category=${encodeURIComponent(category)}`
    )
  );

  return (
    <Container className="py-8 sm:py-10">
      <PageHeader
        actions={
          <>
            {user?.is_staff ? (
              <Link className="action-primary" href="/add_problem">
                Add Problem
              </Link>
            ) : null}
            <Link className="action-link" href="/problems">
              All categories
            </Link>
          </>
        }
        description="A focused queue of problems for this track."
        kicker="Problems"
        title={categoryName}
      />

      {problems.length ? (
        <div className="surface mt-6 overflow-hidden">
          <div className="overflow-x-auto subtle-scrollbar">
            <table className="data-table min-w-[780px]">
              <thead>
                <tr>
                  <th className="w-24">ID</th>
                  <th>Title</th>
                  <th className="hidden md:table-cell">Categories</th>
                  <th className="w-32">Solved</th>
                  <th className="hidden w-36 md:table-cell">Limits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {problems.map((p) => {
                  const cats = (p.categories ?? [])
                    .map((c) => c.long_name)
                    .filter((name) => name.toLowerCase() !== "problemset");
                  const statusTone =
                    p.user_status === "solved" ? "emerald" : p.user_status === "attempted" ? "amber" : "slate";
                  const statusLabel =
                    p.user_status === "solved" ? "Solved" : p.user_status === "attempted" ? "Tried" : "Open";
                  return (
                    <tr key={p.id}>
                      <td className="font-mono font-bold text-slate-700">{p.id}</td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <Link className="font-bold text-slate-950 hover:text-blue-700" href={`/problem/${p.id}`}>
                            {p.title}
                          </Link>
                          <div className="md:hidden">
                            <Badge tone={statusTone}>{statusLabel}</Badge>
                          </div>
                        </div>
                      </td>
                      <td className="hidden text-slate-600 md:table-cell">{cats.join(", ") || "—"}</td>
                      <td>
                        <Link href={`/problem/${p.id}/submissions?verdict=AC`}>
                          <Badge tone={statusTone}>
                            {p.solved_count ?? 0} AC
                          </Badge>
                        </Link>
                      </td>
                      <td className="hidden text-slate-600 md:table-cell">
                        {p.time_limit}s / {p.memory_limit}MB
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          action={
            <Link className="action-link" href="/problems">
              Browse categories
            </Link>
          }
          description="This category does not have public problems yet."
          title="No problems found"
        />
      )}
    </Container>
  );
}
