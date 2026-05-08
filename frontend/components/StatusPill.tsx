import { cn } from "@/lib/cn";

const STATUS_META: Record<string, { full: string; className: string; dotClassName: string }> = {
  AC: {
    full: "Accepted (AC)",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotClassName: "bg-emerald-500"
  },
  IQ: {
    full: "In queue (IQ)",
    className: "bg-slate-50 text-slate-700 border-slate-200",
    dotClassName: "bg-slate-400"
  },
  T: {
    full: "Testing (T)",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    dotClassName: "bg-blue-500"
  },
  CE: {
    full: "Compilation Error (CE)",
    className: "bg-amber-50 text-amber-800 border-amber-200",
    dotClassName: "bg-amber-500"
  },
  WA: {
    full: "Wrong Answer (WA)",
    className: "bg-rose-50 text-rose-700 border-rose-200",
    dotClassName: "bg-rose-500"
  },
  RE: {
    full: "Runtime Error (RE)",
    className: "bg-rose-50 text-rose-700 border-rose-200",
    dotClassName: "bg-rose-500"
  },
  TLE: {
    full: "Time Limit Exceeded (TLE)",
    className: "bg-rose-50 text-rose-700 border-rose-200",
    dotClassName: "bg-rose-500"
  },
  MLE: {
    full: "Memory Limit Exceeded (MLE)",
    className: "bg-rose-50 text-rose-700 border-rose-200",
    dotClassName: "bg-rose-500"
  }
};

const KNOWN_CODES = new Set(["IQ", "T", "AC", "WA", "TLE", "MLE", "CE", "RE"]);

export function statusPillMetaForCode(code: string | null | undefined) {
  const c = (code ?? "").trim().toUpperCase();
  const normalized = KNOWN_CODES.has(c) ? c : c || null;
  const fallback = {
    full: normalized || "—",
    className: "bg-slate-50 text-slate-700 border-slate-200",
    dotClassName: "bg-slate-400"
  };
  if (!normalized) return { code: null, ...fallback };
  return { code: normalized, ...(STATUS_META[normalized] ?? fallback) };
}

export default function StatusPill({ verdict }: { verdict: string | null | undefined }) {
  const raw = (verdict ?? "").trim();

  let code: string | null = null;
  let testcase: number | null = null;

  if (!raw) {
    code = null;
  } else if (raw.toLowerCase() === "in queue") {
    code = "IQ";
  } else {
    const parts = raw.split(/\s+/).filter(Boolean);
    const c = (parts[0] ?? "").toUpperCase();
    code = statusPillMetaForCode(c).code;
    if (parts.length >= 2) {
      const n = Number(parts[1]);
      testcase = Number.isFinite(n) && n > 0 ? Math.trunc(n) : null;
    }
  }

  const meta = code ? statusPillMetaForCode(code) : null;

  const display = code ? (testcase ? `${code} ${testcase}` : code) : "—";
  const title = code
    ? testcase
      ? `${meta?.full ?? code} — test ${testcase}`
      : meta?.full ?? code
    : "No verdict";
  const className = code
    ? meta?.className ?? "bg-slate-50 text-slate-700 border-slate-200"
    : "bg-slate-50 text-slate-600 border-slate-200";
  const dotClassName = code ? meta?.dotClassName ?? "bg-slate-400" : "bg-slate-300";

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold whitespace-nowrap shadow-sm",
        className
      )}
      title={title}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotClassName)} />
      {display}
    </span>
  );
}
