export function verdictCodeFromDisplay(raw: string | null | undefined): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  if (v.toLowerCase() === "in queue") return "IQ";
  const code = (v.split(/\s+/)[0] ?? "").toUpperCase();
  return code || null;
}

export function isFinalVerdictCode(code: string | null | undefined): boolean {
  return code === "AC" || code === "WA" || code === "TLE" || code === "MLE" || code === "CE" || code === "RE";
}

export function isFinalVerdictDisplay(raw: string | null | undefined): boolean {
  return isFinalVerdictCode(verdictCodeFromDisplay(raw));
}

