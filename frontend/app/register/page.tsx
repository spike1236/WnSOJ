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
      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="bg-blue-600 p-6 text-white">
          <h1 className="text-lg font-semibold tracking-tight">Register in WnSOJ</h1>
          <p className="mt-1 text-sm text-blue-100">Create an account to submit solutions and track progress.</p>
        </div>
        <div className="p-6">
          <RegisterForm initialError={error} />
          <p className="mt-5 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link className="font-medium text-blue-600 hover:underline" href="/login">
              Login
            </Link>
          </p>
        </div>
      </div>
    </Container>
  );
}
