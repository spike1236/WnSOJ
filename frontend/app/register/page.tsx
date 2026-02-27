import Container from "@/components/Container";
import Link from "next/link";
import RegisterForm from "@/app/register/RegisterForm";

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
        <div className="card-surface lift-in rounded-3xl p-7 lg:col-span-5">
          <div className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            Join WnSOJ
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">Create your account and start competing.</h1>
          <p className="mt-3 text-sm text-slate-600">
            Register as a common user to solve tasks, or as a business account to publish engineering jobs.
          </p>
          <div className="mt-6 grid gap-3">
            <div className="card-soft rounded-2xl p-4 text-sm text-slate-700">Track verdict breakdown and submission history on your profile.</div>
            <div className="card-soft rounded-2xl p-4 text-sm text-slate-700">Receive personalized problem recommendations from your dashboard.</div>
          </div>
        </div>

        <div className="card-surface rounded-3xl p-7 lg:col-span-7">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Registration Form</h2>
          <p className="mt-1 text-sm text-slate-600">Username must be 3-16 alphanumeric characters.</p>
          <div className="mt-5">
            <RegisterForm initialError={error} />
          </div>
          <p className="mt-5 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link className="font-semibold text-[#304765] hover:underline" href="/login">
              Login
            </Link>
          </p>
        </div>
      </div>
    </Container>
  );
}
