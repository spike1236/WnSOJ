"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import StatusPill from "@/components/StatusPill";
import { formatDateTime } from "@/lib/format";
import type { SubmissionListItem } from "@/lib/types";

type StreamPayload = {
  kind?: string;
  id?: number;
  verdict?: string | null;
  time?: number | null;
  memory?: number | null;
  current_test?: number;
  total_tests?: number;
  stage?: string;
};

function verdictCode(raw: string | null | undefined): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  if (v.toLowerCase() === "in queue") return "IQ";
  const code = (v.split(/\s+/)[0] ?? "").toUpperCase();
  return code || null;
}

function isFinalCode(code: string | null) {
  return code === "AC" || code === "WA" || code === "TLE" || code === "MLE" || code === "CE" || code === "RE";
}

export default function SubmissionsTableClient({ initial }: { initial: SubmissionListItem[] }) {
  const [rows, setRows] = useState<(SubmissionListItem & { progressLabel?: string | null })[]>(
    initial.map((r) => ({ ...r, progressLabel: null }))
  );

  const idsToWatch = useMemo(() => {
    const ids: number[] = [];
    for (const r of initial) {
      if (!isFinalCode(verdictCode(r.verdict))) ids.push(r.id);
    }
    return ids;
  }, [initial]);

  const pending = useRef<Set<number>>(new Set(idsToWatch));

  useEffect(() => {
    if (!idsToWatch.length) return;

    const url = `/backend/submissions/stream?ids=${encodeURIComponent(idsToWatch.join(","))}`;
    const es = new EventSource(url);

    const applyPayload = (payload: StreamPayload) => {
      if (typeof payload.id !== "number") return;

      setRows((prev) =>
        prev.map((r) => {
          if (r.id !== payload.id) return r;
          const next = { ...r };
          if (payload.verdict !== undefined) next.verdict = payload.verdict ?? null;
          if (payload.time !== undefined) next.time = payload.time ?? null;
          if (payload.memory !== undefined) next.memory = payload.memory ?? null;
          if (payload.kind === "progress" && payload.stage === "test" && payload.current_test && payload.total_tests) {
            next.progressLabel = `Testing ${payload.current_test}/${payload.total_tests}`;
          } else if (payload.kind !== "snapshot") {
            next.progressLabel = null;
          }
          return next;
        })
      );

      if (payload.kind === "final") {
        pending.current.delete(payload.id);
        if (pending.current.size === 0) es.close();
      }
    };

    const onAnyEvent = (evt: MessageEvent) => {
      try {
        const payload = JSON.parse(evt.data) as unknown;
        if (!payload || typeof payload !== "object") return;
        applyPayload(payload as StreamPayload);
      } catch {
        return;
      }
    };

    es.addEventListener("snapshot", onAnyEvent);
    es.addEventListener("final", onAnyEvent);
    es.onmessage = onAnyEvent;

    return () => {
      es.close();
    };
  }, [idsToWatch]);

  return (
    <>
      {rows.slice(0, 50).map((s) => (
        <tr className="bg-white" key={s.id}>
          <td className="px-4 py-3 font-mono">
            <Link className="text-blue-600 hover:underline" href={`/submission/${s.id}`}>
              {s.id}
            </Link>
          </td>
          <td className="px-4 py-3 text-slate-700">
            <time dateTime={s.send_time} suppressHydrationWarning>
              {formatDateTime(s.send_time)}
            </time>
          </td>
          <td className="px-4 py-3">
            <Link className="text-blue-600 hover:underline" href={`/profile/${encodeURIComponent(s.username)}`}>
              {s.username}
            </Link>
          </td>
          <td className="px-4 py-3">
            <Link className="font-medium text-slate-900 hover:underline" href={`/problem/${s.problem_id}`}>
              {s.problem_title}
            </Link>
          </td>
          <td className="px-4 py-3 hidden lg:table-cell text-slate-700">{s.language}</td>
          <td className="px-4 py-3">
            <div className="flex flex-col items-start gap-1">
              <StatusPill verdict={s.verdict} />
              {s.progressLabel ? <span className="text-xs text-slate-500">{s.progressLabel}</span> : null}
            </div>
          </td>
          <td className="px-4 py-3 hidden md:table-cell text-slate-700">
            {s.time === null || s.time === undefined ? "—" : `${s.time} ms`}
          </td>
          <td className="px-4 py-3 hidden md:table-cell text-slate-700">
            {s.memory === null || s.memory === undefined ? "—" : `${s.memory} KB`}
          </td>
        </tr>
      ))}
      {rows.length === 0 ? (
        <tr className="bg-white">
          <td className="px-4 py-10 text-center text-slate-600" colSpan={8}>
            No submissions found.
          </td>
        </tr>
      ) : null}
    </>
  );
}
