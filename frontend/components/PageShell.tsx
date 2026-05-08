import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function PageHeader({
  kicker,
  title,
  description,
  actions,
  className
}: {
  kicker?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {kicker ? <div className="page-kicker">{kicker}</div> : null}
        <h1 className="mt-2 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">{title}</h1>
        {description ? <div className="mt-2 max-w-3xl text-base leading-7 text-slate-600">{description}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div> : null}
    </div>
  );
}

export function SectionPanel({
  title,
  description,
  actions,
  children,
  className
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("surface overflow-hidden", className)}>
      {title || description || actions ? (
        <div className="flex flex-col gap-3 border-b bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title ? <h2 className="text-base font-bold tracking-normal text-slate-950">{title}</h2> : null}
            {description ? <div className="mt-1 text-sm leading-6 text-slate-600">{description}</div> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="surface grid place-items-center px-5 py-12 text-center">
      <div>
        <div className="text-base font-bold text-slate-950">{title}</div>
        {description ? <div className="mt-2 max-w-lg text-sm leading-6 text-slate-600">{description}</div> : null}
        {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}

export function Badge({
  children,
  tone = "slate",
  className
}: {
  children: ReactNode;
  tone?: "slate" | "blue" | "emerald" | "amber" | "rose";
  className?: string;
}) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    rose: "border-rose-200 bg-rose-50 text-rose-700"
  };

  return (
    <span className={cn("inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-bold", tones[tone], className)}>
      {children}
    </span>
  );
}
