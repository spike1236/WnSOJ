import Container from "@/components/Container";
import Link from "next/link";
import LoginForm from "@/app/login/LoginForm";

export default async function Page({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;

  return (
    <Container className="py-10">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="card-surface lift-in rounded-3xl p-7 lg:col-span-7">
          <div className="inline-flex rounded-full border border-[#9eb0c5] bg-[#eef3f8] px-3 py-1 text-xs font-semibold text-[#304765]">Welcome back</div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">Log in to continue solving and tracking your progress.</h1>
          <p className="mt-3 text-sm text-slate-600">
            Use your credentials to access submissions, profile analytics, and personalized recommendations.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="card-soft rounded-2xl p-4 text-sm text-slate-700">Live verdict updates for your pending submissions.</div>
            <div className="card-soft rounded-2xl p-4 text-sm text-slate-700">Access profile stats and recent activity history.</div>
          </div>
        </div>

        <div className="card-surface rounded-3xl p-7 lg:col-span-5">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Sign In</h2>
          <p className="mt-1 text-sm text-slate-600">Username and password are required.</p>
          <div className="mt-5">
            <LoginForm initialError={error} />
          </div>
          <p className="mt-5 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link className="font-semibold text-[#304765] hover:underline" href="/register">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </Container>
  );
}
