import "server-only";

const REQUEST_ID_RE = /^[A-Za-z0-9._:-]{1,128}$/;
const REDACTED_KEY_RE = /(authorization|cookie|password|secret|token|key)/i;

type LogLevel = "INFO" | "WARNING" | "ERROR";
type LogMeta = Record<string, unknown>;
const LEVEL_VALUES: Record<LogLevel, number> = {
  INFO: 20,
  WARNING: 30,
  ERROR: 40
};

export function normalizeRequestId(value: string | null | undefined) {
  const requestId = value?.trim() || "";
  if (requestId && REQUEST_ID_RE.test(requestId)) return requestId;
  return crypto.randomUUID();
}

export function logInfo(message: string, meta: LogMeta = {}) {
  writeLog("INFO", message, meta);
}

export function logWarning(message: string, meta: LogMeta = {}) {
  writeLog("WARNING", message, meta);
}

export function logError(message: string, meta: LogMeta = {}) {
  writeLog("ERROR", message, meta);
}

function writeLog(level: LogLevel, message: string, meta: LogMeta) {
  if (!shouldLog(level)) return;

  const timestamp = new Date().toISOString();
  const sanitized = sanitizeMeta(meta);
  const service = logServiceName();
  const record = {
    timestamp,
    level,
    service,
    message,
    ...sanitized
  };

  if ((process.env.LOG_FORMAT || "plain").toLowerCase() === "json") {
    writeConsole(level, JSON.stringify(record));
    return;
  }

  const requestId = typeof sanitized.request_id === "string" ? sanitized.request_id : "-";
  const rest = Object.fromEntries(
    Object.entries(sanitized).filter(([key]) => key !== "request_id")
  );
  const suffix = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : "";
  writeConsole(level, `${timestamp} ${level} [${service}] [${requestId}] ${message}${suffix}`);
}

function writeConsole(level: LogLevel, line: string) {
  if (level === "ERROR") {
    console.error(line);
  } else if (level === "WARNING") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export function shouldLog(level: LogLevel) {
  if (!logEnabled()) return false;
  const configured = (process.env.LOG_LEVEL || "INFO").toUpperCase();
  const threshold = LEVEL_VALUES[configured as LogLevel] ?? LEVEL_VALUES.INFO;
  return LEVEL_VALUES[level] >= threshold;
}

function logEnabled() {
  const value = (process.env.LOG_ENABLED || "true").trim().toLowerCase();
  return !["0", "false", "no", "off"].includes(value);
}

function logServiceName() {
  const value = process.env.LOG_SERVICE_NAME?.trim();
  if (!value) throw new Error("LOG_SERVICE_NAME is required.");
  return value;
}

function sanitizeMeta(meta: LogMeta): LogMeta {
  return Object.fromEntries(
    Object.entries(meta)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [
        key,
        REDACTED_KEY_RE.test(key) ? "[redacted]" : sanitizeValue(value)
      ])
  );
}

function sanitizeValue(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack
    };
  }
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, child]) => [
        key,
        REDACTED_KEY_RE.test(key) ? "[redacted]" : sanitizeValue(child)
      ])
    );
  }
  return value;
}
