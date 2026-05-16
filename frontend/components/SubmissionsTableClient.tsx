"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import LocalTime from "@/components/LocalTime";
import StatusPill from "@/components/StatusPill";
import type { SubmissionListItem } from "@/lib/types";
import { isFinalVerdictDisplay } from "@/lib/verdict";

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

type SubmissionRow = SubmissionListItem & { progressLabel?: string | null };

export default function SubmissionsTableClient({ initial }: { initial: SubmissionListItem[] }) {
  const initialRows = useMemo<SubmissionRow[]>(() => initial.map((r) => ({ ...r, progressLabel: null })), [initial]);
  const [rows, setRows] = useState<SubmissionRow[]>(initialRows);

  const idsToWatch = useMemo(() => {
    const ids: number[] = [];
    for (const r of initial) {
      if (!isFinalVerdictDisplay(r.verdict)) ids.push(r.id);
    }
    return ids;
  }, [initial]);

  const pending = useRef<Set<number>>(new Set(idsToWatch));

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  useEffect(() => {
    pending.current = new Set(idsToWatch);
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
        <tr key={s.id}>
          <td className="font-mono">
            <Link className="font-bold text-blue-600 hover:text-blue-700" href={`/submission/${s.id}`}>
              {s.id}
            </Link>
          </td>
          <td className="text-slate-700">
            <LocalTime value={s.send_time} />
          </td>
          <td>
            <Link className="font-semibold text-slate-800 hover:text-blue-700" href={`/profile/${encodeURIComponent(s.username)}`}>
              {s.username}
            </Link>
          </td>
          <td>
            <Link className="font-bold text-slate-950 hover:text-blue-700" href={`/problem/${s.problem_id}`}>
              {s.problem_title}
            </Link>
          </td>
          <td className="hidden text-slate-700 lg:table-cell">{s.language}</td>
          <td>
            <div className="flex flex-col items-start gap-1">
              <StatusPill verdict={s.verdict} />
              {s.progressLabel ? <span className="text-xs text-slate-500">{s.progressLabel}</span> : null}
            </div>
          </td>
          <td className="hidden text-slate-700 md:table-cell">
            {s.time === null || s.time === undefined ? "—" : `${s.time} ms`}
          </td>
          <td className="hidden text-slate-700 md:table-cell">
            {s.memory === null || s.memory === undefined ? "—" : `${s.memory} KB`}
          </td>
        </tr>
      ))}
      {rows.length === 0 ? (
        <tr>
          <td className="py-10 text-center text-slate-600" colSpan={8}>
            No submissions found.
          </td>
        </tr>
      ) : null}
    </>
  );
}
