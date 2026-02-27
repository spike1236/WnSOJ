"use client";

import { useEffect, useState } from "react";

import { formatDate, formatDateTime } from "@/lib/format";

export default function LocalTime({
  value,
  mode = "datetime",
  className,
  fallback = "—"
}: {
  value: string;
  mode?: "date" | "datetime";
  className?: string;
  fallback?: string;
}) {
  const [text, setText] = useState<string>(fallback);

  useEffect(() => {
    if (!value) {
      setText(fallback);
      return;
    }
    setText(mode === "date" ? formatDate(value) : formatDateTime(value));
  }, [value, mode, fallback]);

  return (
    <time className={className} dateTime={value} suppressHydrationWarning>
      {text}
    </time>
  );
}
