import { cn } from "@/lib/cn";
import Link from "next/link";

export default function ProblemNav({
  problemId,
  active
}: {
  problemId: number | string;
  active: "statement" | "editorial" | "submissions";
}) {
  const items = [
    { id: "statement" as const, label: "Statement", href: `/problem/${problemId}` },
    { id: "editorial" as const, label: "Editorial", href: `/problem/${problemId}/editorial` },
    { id: "submissions" as const, label: "Submissions", href: `/problem/${problemId}/submissions` }
  ];

  return (
    <div className="mt-4 overflow-x-auto subtle-scrollbar">
      <div className="inline-flex min-w-full gap-1 rounded-[8px] border bg-white p-1 shadow-sm sm:min-w-0">
        {items.map((it) => (
          <Link
            className={cn(
              "flex-1 whitespace-nowrap rounded-[6px] px-4 py-2 text-center text-sm font-bold transition sm:flex-none",
              active === it.id ? "bg-blue-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
            )}
            href={it.href}
            key={it.id}
          >
            {it.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
