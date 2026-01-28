export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "2-digit"
  }).format(date);
}

export function formatNumber(value: number) {
  if (!Number.isFinite(value)) return String(value);
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\\.0$/, "")}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\\.0$/, "")}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\\.0$/, "")}k`;
  return String(Math.trunc(value));
}

export function formatSalaryRange(range: { min?: unknown; max?: unknown; currency?: unknown } | null) {
  if (!range) return "Salary not specified";
  const currency = typeof range.currency === "string" ? range.currency : "$";
  const min = Number(range.min);
  const max = Number(range.max);
  const hasMin = Number.isFinite(min) && min > 0;
  const hasMax = Number.isFinite(max) && max > 0;
  if (!hasMin && !hasMax) return "Salary not specified";
  if (hasMin && !hasMax) return `At least ${formatNumber(min)}${currency}/yr`;
  if (!hasMin && hasMax) return `Up to ${formatNumber(max)}${currency}/yr`;
  return `${formatNumber(min)}${currency} - ${formatNumber(max)}${currency}/yr`;
}

