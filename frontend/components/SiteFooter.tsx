import Container from "@/components/Container";
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/60 bg-[#eef2f8]/70">
      <Container className="py-10">
        <div className="card-surface grid gap-8 rounded-3xl p-6 md:grid-cols-3 md:p-8">
          <div>
            <div className="inline-flex items-center gap-2 text-slate-900">
              <span className="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg border border-slate-300 bg-white">
                <img alt="WnSOJ" className="h-full w-full object-cover" src="/favicon.ico" />
              </span>
              <span className="text-base font-semibold tracking-tight">WnSOJ</span>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Training ground for algorithmic problem solving and technical hiring.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Explore</h3>
            <div className="mt-3 grid gap-2 text-sm">
              <Link className="text-slate-600 hover:text-slate-900" href="/dashboard">
                Dashboard
              </Link>
              <Link className="text-slate-600 hover:text-slate-900" href="/problems">
                Problem Archive
              </Link>
              <Link className="text-slate-600 hover:text-slate-900" href="/jobs">
                Job Board
              </Link>
              <Link className="text-slate-600 hover:text-slate-900" href="/faq">
                FAQ
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Platform</h3>
            <div className="mt-3 grid gap-2 text-sm text-slate-600">
              <p>Built with Next.js + Django + DRF</p>
              <p>Live verdict updates through SSE</p>
              <p className="pt-1">© 2021-2026 Akram Rakhmetulla</p>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
