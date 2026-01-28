import { cn } from "@/lib/cn";

export default function StatusPill({ verdict }: { verdict: string | null | undefined }) {
  const v = (verdict ?? "").trim();
  const parts = v.split(/\s+/).filter(Boolean);
  const code = parts[0] || "—";
  const testcase = parts.length >= 2 ? parts[1] : null;
  const label = testcase ? `${code} ${testcase}` : code;
  const className =
    code === "AC"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : code === "CE"
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : code === "IQ"
          ? "bg-slate-50 text-slate-700 border-slate-200"
          : code === "—"
            ? "bg-slate-50 text-slate-600 border-slate-200"
            : "bg-rose-50 text-rose-700 border-rose-200";

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold", className)}>
      {label}
    </span>
  );
}
