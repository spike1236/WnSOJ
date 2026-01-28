import Container from "@/components/Container";
import { backendFetchJson } from "@/lib/backend.server";
import type { UserDetail } from "@/lib/types";
import Link from "next/link";

async function currentUser() {
  try {
    return await backendFetchJson<UserDetail>("/api/profile/");
  } catch {
    return null;
  }
}

function FeatureCard({
  title,
  description,
  href,
  cta,
  imgSrc
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
  imgSrc: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md">
      <Link className="block" href={href}>
        <div className="bg-slate-50 p-6">
          <img alt={title} className="mx-auto h-36 w-auto" src={imgSrc} />
        </div>
      </Link>
      <div className="p-6">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
        <Link
          className="mt-4 inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
          href={href}
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const user = await currentUser();

  return (
    <Container className="py-10">
      <div className="rounded-3xl border bg-gradient-to-b from-slate-50 to-white p-10 text-center shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Welcome to WnSOJ</h1>
        <p className="mt-3 text-slate-600">
          Your platform for programming challenges, problem-solving, and career opportunities.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            href="/problems"
          >
            Explore Problems
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-slate-50"
            href="/jobs"
          >
            Browse Jobs
          </Link>
        </div>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        <FeatureCard
          title="Solve Problems"
          description="Challenge yourself with programming and math problems across difficulty levels and categories."
          href="/problems"
          cta="Start Coding"
          imgSrc="/img/main_page_card1.svg"
        />
        <FeatureCard
          title="Get a Job"
          description="Discover career opportunities and connect with employers."
          href="/jobs"
          cta="Browse Jobs"
          imgSrc="/img/main_page_card2.svg"
        />
        <FeatureCard
          title="Be the Best"
          description="Sharpen your skills and track your progress through submissions and verdicts."
          href="/problems"
          cta="Start Competing"
          imgSrc="/img/main_page_card3.svg"
        />
      </div>

      <div className="mt-10 rounded-2xl border bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-semibold tracking-tight">Ready to get started?</h2>
        <p className="mt-2 text-slate-600">Join the community and start your coding journey today.</p>
        <div className="mt-5 flex justify-center gap-3">
          {user ? (
            <>
              <Link
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                href="/problems"
              >
                Explore Problems
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-slate-50"
                href={`/profile/${encodeURIComponent(user.username)}`}
              >
                View Profile
              </Link>
            </>
          ) : (
            <>
              <Link
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                href="/register"
              >
                Get Started for Free
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-slate-50"
                href="/login"
              >
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </Container>
  );
}
