import { cn } from "@/lib/cn";

const STATUS_META: Record<string, { full: string; className: string }> = {
  AC: { full: "Accepted (AC)", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  IQ: { full: "In queue (IQ)", className: "bg-slate-50 text-slate-700 border-slate-200" },
  CE: { full: "Compilation Error (CE)", className: "bg-amber-50 text-amber-800 border-amber-200" },
  WA: { full: "Wrong Answer (WA)", className: "bg-rose-50 text-rose-700 border-rose-200" },
  RE: { full: "Runtime Error (RE)", className: "bg-rose-50 text-rose-700 border-rose-200" },
  TLE: { full: "Time Limit Exceeded (TLE)", className: "bg-rose-50 text-rose-700 border-rose-200" },
  MLE: { full: "Memory Limit Exceeded (MLE)", className: "bg-rose-50 text-rose-700 border-rose-200" }
};

const KNOWN_CODES = new Set(["IQ", "AC", "WA", "TLE", "MLE", "CE", "RE"]);

export function statusPillMetaForCode(code: string | null | undefined) {
  const c = (code ?? "").trim().toUpperCase();
  const normalized = KNOWN_CODES.has(c) ? c : c || null;
  const fallback = { full: normalized || "—", className: "bg-slate-50 text-slate-700 border-slate-200" };
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

  return (
    <span
      className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold", className)}
      title={title}
    >
      {display}
    </span>
  );
}
