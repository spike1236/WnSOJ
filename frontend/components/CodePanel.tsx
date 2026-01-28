"use client";

import { cn } from "@/lib/cn";
import { useEffect, useMemo, useState } from "react";

function IconCopy({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" height="16" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 9h10v10H9V9Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function IconChevron({ className, down }: { className?: string; down: boolean }) {
  return (
    <svg className={className} fill="none" height="16" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
      <path
        d={down ? "M6 9l6 6 6-6" : "M6 15l6-6 6 6"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function CodePanel({
  title,
  languageLabel,
  code,
  collapsible = false,
  defaultCollapsed = false,
  className
}: {
  title: string;
  languageLabel?: string;
  code: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
}) {
  const [collapsed, setCollapsed] = useState(collapsible ? defaultCollapsed : false);
  const [wrap, setWrap] = useState(false);
  const [copied, setCopied] = useState(false);

  const cleaned = useMemo(() => (code ?? "").replace(/\r\n/g, "\n"), [code]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1200);
    return () => clearTimeout(t);
  }, [copied]);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(cleaned);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const hasCode = cleaned.trim().length > 0;

  return (
    <div className={cn("rounded-2xl border bg-white shadow-sm", className)}>
      <div className="flex flex-col gap-2 border-b bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {languageLabel ? <span className="text-xs text-slate-500">{languageLabel}</span> : null}
          {!hasCode ? <span className="text-xs text-slate-500">(empty)</span> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            disabled={!hasCode}
            onClick={onCopy}
            type="button"
          >
            <IconCopy />
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            className="inline-flex items-center rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => setWrap((v) => !v)}
            type="button"
          >
            {wrap ? "No wrap" : "Wrap"}
          </button>
          {collapsible ? (
            <button
              className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => setCollapsed((v) => !v)}
              type="button"
            >
              <IconChevron className="text-slate-500" down={collapsed} />
              {collapsed ? "Show" : "Hide"}
            </button>
          ) : null}
        </div>
      </div>
      {collapsed ? null : (
        <pre className={cn("overflow-auto p-4 text-sm", wrap ? "whitespace-pre-wrap" : "whitespace-pre")}>
          <code>{cleaned}</code>
        </pre>
      )}
    </div>
  );
}
