export function defaultMessageForStatus(status: number) {
  if (status === 400) return "Bad request.";
  if (status === 401) return "Not authenticated.";
  if (status === 403) return "Forbidden.";
  if (status === 404) return "Not found.";
  if (status === 429) return "Too many requests.";
  if (status >= 500) return "Server error.";
  return `Request failed (${status}).`;
}

