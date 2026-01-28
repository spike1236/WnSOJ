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
      <div className="mx-auto max-w-md overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="bg-slate-900 p-6 text-white">
          <h1 className="text-lg font-semibold tracking-tight">Log in to WnSOJ</h1>
          <p className="mt-1 text-sm text-slate-200">Use your username and password to continue.</p>
        </div>
        <div className="p-6">
          <LoginForm initialError={error} />
          <p className="mt-5 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link className="font-medium text-blue-600 hover:underline" href="/register">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </Container>
  );
}
