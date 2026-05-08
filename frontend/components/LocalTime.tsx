"use client";

import { useEffect, useState } from "react";

function fallbackText(value: string, mode: "date" | "datetime") {
  const datePart = value.slice(0, 10);
  if (mode === "date") return datePart || value;
  const timePart = value.includes("T") ? value.split("T")[1]?.slice(0, 5) : "";
  return timePart ? `${datePart} ${timePart}` : value;
}

export default function LocalTime({
  value,
  mode = "datetime",
  className
}: {
  value: string;
  mode?: "date" | "datetime";
  className?: string;
}) {
  const [label, setLabel] = useState(() => fallbackText(value, mode));

  useEffect(() => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      setLabel(value);
      return;
    }

    const options: Intl.DateTimeFormatOptions =
      mode === "date"
        ? { year: "numeric", month: "long", day: "2-digit" }
        : {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          };

    setLabel(new Intl.DateTimeFormat(navigator.language || undefined, options).format(date));
  }, [mode, value]);

  return (
    <time className={className} dateTime={value} suppressHydrationWarning>
      {label}
    </time>
  );
}
