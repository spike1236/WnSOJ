import Container from "@/components/Container";

export const metadata = {
  title: "FAQ"
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-surface rounded-3xl p-6 md:p-7">
      <h2 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
      <div className="mt-4 text-sm leading-7 text-slate-700">{children}</div>
    </section>
  );
}

export default function Page() {
  return (
    <Container className="py-10">
      <section className="card-surface lift-in rounded-3xl p-6 md:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">FAQ</h1>
        <p className="mt-3 text-sm text-slate-600">
          WnSOJ combines competitive programming practice with a built-in job board for engineering roles.
        </p>
      </section>

      <div className="stagger-in mt-6 grid gap-6">
        <Section title="How problem solving works">
          <p>Open any task from the Problems section, submit C++ or Python code, and wait for the verdict pipeline.</p>
          <p className="mt-3">Current runner commands:</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">GNU C++23</div>
              <pre className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                g++ -O2 -std=c++23 -DONLINE_JUDGE source.cpp -o source
              </pre>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Python 3.12</div>
              <pre className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                python3.12 source.py
              </pre>
            </div>
          </div>
        </Section>

        <Section title="Verdict glossary">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/70 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr><td className="px-4 py-3 font-mono">IQ</td><td className="px-4 py-3">In queue, waiting to run.</td></tr>
                <tr><td className="px-4 py-3 font-mono">T</td><td className="px-4 py-3">Testing is in progress (live feed may show current test as x/y).</td></tr>
                <tr><td className="px-4 py-3 font-mono">AC</td><td className="px-4 py-3">Accepted, all tests passed.</td></tr>
                <tr><td className="px-4 py-3 font-mono">WA</td><td className="px-4 py-3">Wrong answer on at least one testcase.</td></tr>
                <tr><td className="px-4 py-3 font-mono">CE</td><td className="px-4 py-3">Compilation error.</td></tr>
                <tr><td className="px-4 py-3 font-mono">RE</td><td className="px-4 py-3">Runtime error.</td></tr>
                <tr><td className="px-4 py-3 font-mono">TLE</td><td className="px-4 py-3">Execution exceeded time limit.</td></tr>
                <tr><td className="px-4 py-3 font-mono">MLE</td><td className="px-4 py-3">Execution exceeded memory limit.</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Current test progress (for example, &quot;Testing 3/20&quot;) is streamed in submissions feed tables.
          </p>
        </Section>

        <Section title="Jobs and account types">
          <p>Common accounts can browse and apply to job opportunities.</p>
          <p>Business accounts can create, edit, and remove job posts.</p>
          <p className="mt-3">You can manage account details and avatar from the profile settings page.</p>
        </Section>
      </div>
    </Container>
  );
}
