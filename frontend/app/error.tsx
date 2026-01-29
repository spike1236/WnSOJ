"use client";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="rounded-2xl border bg-white p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-2 text-slate-600">Sorry — something went wrong. Please try again.</p>
        {isDev ? (
          <details className="mt-4 rounded-lg border bg-slate-50 px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium text-slate-700">Debug details</summary>
            <pre className="mt-3 overflow-auto text-xs text-slate-800">{error.message}</pre>
          </details>
        ) : null}
        <button
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          onClick={() => reset()}
          type="button"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
