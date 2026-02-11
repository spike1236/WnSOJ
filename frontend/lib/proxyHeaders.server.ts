import "server-only";

export function copyResponseHeadersToHeaders(from: Response, to: Headers) {
  for (const [key, value] of from.headers.entries()) {
    const k = key.toLowerCase();
    if (k === "content-encoding" || k === "content-length" || k === "connection" || k === "transfer-encoding") continue;
    if (k === "set-cookie") continue;
    to.set(key, value);
  }
  const anyHeaders = from.headers as unknown as { getSetCookie?: () => string[] };
  const setCookies = typeof anyHeaders.getSetCookie === "function" ? anyHeaders.getSetCookie() : [];
  if (setCookies.length) {
    for (const c of setCookies) to.append("set-cookie", c);
  } else {
    const single = from.headers.get("set-cookie");
    if (single) to.set("set-cookie", single);
  }
}

