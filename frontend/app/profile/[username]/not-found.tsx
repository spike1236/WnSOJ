import Container from "@/components/Container";
import Link from "next/link";

export default function NotFound() {
  return (
    <Container className="py-10">
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Profile not found</h1>
        <p className="mt-2 text-slate-600">This user doesn’t exist (or the profile is no longer available).</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700"
            href="/problems"
          >
            Browse problems
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-lg border px-5 text-sm font-medium hover:bg-slate-50"
            href="/"
          >
            Home
          </Link>
        </div>
      </div>
    </Container>
  );
}

