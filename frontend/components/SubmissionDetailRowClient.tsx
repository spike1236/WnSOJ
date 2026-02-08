"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import StatusPill from "@/components/StatusPill";
import { formatDateTime } from "@/lib/format";

type StreamPayload = {
  kind?: string;
  id?: number;
  verdict?: string | null;
  time?: number | null;
  memory?: number | null;
  updated_at?: string;
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

function isFinalVerdict(code: string | null) {
  return code === "AC" || code === "WA" || code === "TLE" || code === "MLE" || code === "CE" || code === "RE";
}

export default function SubmissionDetailRowClient(props: {
  id: number;
  sendTime: string;
  username: string;
  problemId: number;
  problemTitle: string;
  language: string;
  verdict: string | null;
  time: number | null;
  memory: number | null;
}) {
  const [verdict, setVerdict] = useState<string | null>(props.verdict);
  const [time, setTime] = useState<number | null>(props.time);
  const [memory, setMemory] = useState<number | null>(props.memory);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);

  const shouldConnect = useMemo(() => !isFinalVerdict(verdictCode(verdict)), [verdict]);

  useEffect(() => {
    if (!shouldConnect) return;

    const url = `/backend/submissions/${encodeURIComponent(String(props.id))}/stream`;
    const es = new EventSource(url);

    const applyPayload = (payload: StreamPayload) => {
      if (payload.verdict !== undefined) setVerdict(payload.verdict ?? null);
      if (payload.time !== undefined) setTime(payload.time ?? null);
      if (payload.memory !== undefined) setMemory(payload.memory ?? null);
      if (payload.kind === "progress" && payload.stage === "test" && payload.current_test && payload.total_tests) {
        setProgressLabel(`Testing ${payload.current_test}/${payload.total_tests}`);
      } else {
        setProgressLabel(null);
      }
      if (payload.kind === "final") {
        es.close();
      }
    };

    const onAnyEvent = (evt: MessageEvent) => {
      try {
        const payload = JSON.parse(evt.data) as unknown;
        if (!payload || typeof payload !== "object") return;
        applyPayload(payload as StreamPayload);
      } catch {
      }
    };

    es.addEventListener("snapshot", onAnyEvent);
    es.addEventListener("final", onAnyEvent);
    es.onmessage = onAnyEvent;

    return () => {
      es.close();
    };
  }, [props.id, shouldConnect]);

  return (
    <tr className="bg-white">
      <td className="px-4 py-3 font-mono text-slate-700">{props.id}</td>
      <td className="px-4 py-3 text-slate-700">
        <time dateTime={props.sendTime} suppressHydrationWarning>
          {formatDateTime(props.sendTime)}
        </time>
      </td>
      <td className="px-4 py-3">
        <Link className="text-blue-600 hover:underline" href={`/profile/${encodeURIComponent(props.username)}`}>
          {props.username}
        </Link>
      </td>
      <td className="px-4 py-3">
        <Link className="text-blue-600 hover:underline" href={`/problem/${props.problemId}`}>
          {props.problemTitle}
        </Link>
      </td>
      <td className="px-4 py-3 text-slate-700">{props.language}</td>
      <td className="px-4 py-3">
        <div className="flex flex-col items-start gap-1">
          <StatusPill verdict={verdict} />
          {progressLabel ? <span className="text-xs text-slate-500">{progressLabel}</span> : null}
        </div>
      </td>
      <td className="px-4 py-3 hidden md:table-cell text-slate-700">
        {time === null || time === undefined ? "—" : `${time} ms`}
      </td>
      <td className="px-4 py-3 hidden md:table-cell text-slate-700">
        {memory === null || memory === undefined ? "—" : `${memory} KB`}
      </td>
    </tr>
  );
}
