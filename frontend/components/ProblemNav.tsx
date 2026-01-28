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
    <div className="mt-4 overflow-hidden rounded-xl border bg-white">
      <div className="flex">
        {items.map((it) => (
          <Link
            className={cn(
              "flex-1 border-r px-4 py-2 text-center text-sm font-medium last:border-r-0",
              active === it.id ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"
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

