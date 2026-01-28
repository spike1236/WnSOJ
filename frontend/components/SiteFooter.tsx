import Container from "@/components/Container";
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t bg-slate-50">
      <Container className="py-10">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 text-slate-900">
              <span className="text-lg font-semibold">WnSOJ</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Your platform for programming challenges, problem-solving, and career opportunities.
            </p>
            <p className="mt-3 text-sm text-slate-600">© 2021-2026 Akram Rakhmetulla. All Rights Reserved</p>
            <p className="mt-2 text-sm text-slate-600">
              Licensed under Creative Commons Attribution-NonCommercial-ShareAlike 4.0.
            </p>
          </div>
          <div className="md:text-right">
            <h3 className="text-sm font-semibold text-slate-900">Resources</h3>
            <div className="mt-3 grid gap-2 text-sm">
              <Link className="text-slate-600 hover:text-slate-900" href="/problems">
                Problem Archive
              </Link>
              <Link className="text-slate-600 hover:text-slate-900" href="/jobs">
                Job Opportunities
              </Link>
              <Link className="text-slate-600 hover:text-slate-900" href="/faq">
                FAQ & Help
              </Link>
            </div>
            <div className="mt-6 text-sm text-slate-600">
              Built with Next.js + Django
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
