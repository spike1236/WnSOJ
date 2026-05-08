import Container from "@/components/Container";
import { Badge, PageHeader } from "@/components/PageShell";
import SubmissionsTableClient from "@/components/SubmissionsTableClient";
import { backendFetchJson } from "@/lib/backend.server";
import { asArray } from "@/lib/apiList";
import type { ApiList, SubmissionListItem } from "@/lib/types";
import Link from "next/link";

export const metadata = {
  title: "Submissions"
};

export default async function Page({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const username = typeof sp.username === "string" ? sp.username : null;
  const verdict = typeof sp.verdict === "string" ? sp.verdict : null;

  const qs = new URLSearchParams();
  qs.set("compact", "1");
  qs.set("limit", "50");
  if (username) qs.set("username", username);
  if (verdict) qs.set("verdict", verdict);

  const submissions = asArray(await backendFetchJson<ApiList<SubmissionListItem>>(`/api/submissions/?${qs.toString()}`));
  const filterCodes = ["all", "AC", "WA", "TLE", "MLE", "CE", "RE"];
  const filterHref = (code: string) => {
    const next = new URLSearchParams();
    if (username) next.set("username", username);
    if (code !== "all") next.set("verdict", code);
    const str = next.toString();
    return `/submissions${str ? `?${str}` : ""}`;
  };

  return (
    <Container className="py-8 sm:py-10">
      <PageHeader
        actions={
          <Link className="action-link" href="/problems">
            Browse problems
          </Link>
        }
        description={username ? `Filtered to ${username}${verdict ? ` with ${verdict}` : ""}.` : verdict ? `Filtered to ${verdict}.` : "Latest judge activity across the site."}
        kicker="Judge"
        title="Submissions"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {filterCodes.map((code) => (
          <Link href={filterHref(code)} key={code}>
            <Badge tone={(verdict ?? "all") === code ? "blue" : "slate"}>{code === "all" ? "All" : code}</Badge>
          </Link>
        ))}
      </div>

      <div className="surface mt-6 overflow-hidden">
        <div className="overflow-x-auto subtle-scrollbar">
          <table className="data-table min-w-[920px]">
            <thead>
              <tr>
                <th className="w-24">ID</th>
                <th>Time</th>
                <th>User</th>
                <th>Problem</th>
                <th className="hidden lg:table-cell">Language</th>
                <th className="w-32">Verdict</th>
                <th className="hidden w-28 md:table-cell">Exec</th>
                <th className="hidden w-28 md:table-cell">Memory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <SubmissionsTableClient initial={submissions.slice(0, 50)} />
            </tbody>
          </table>
        </div>
      </div>
    </Container>
  );
}
