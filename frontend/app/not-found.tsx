import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="rounded-2xl border bg-white p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-2 text-slate-600">
          The page you are looking for doesn&apos;t exist.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            href="/"
          >
            Go home
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
            href="/problems"
          >
            Browse problems
          </Link>
        </div>
      </div>
    </div>
  );
}

