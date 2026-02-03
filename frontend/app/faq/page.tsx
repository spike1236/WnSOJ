import Container from "@/components/Container";

export const metadata = {
  title: "FAQ"
};

export default function Page() {
  return (
    <Container className="py-10">
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <p className="text-slate-700">
          This site contains an archive of Olympiad programming tasks with a built-in testing system and a work search
          platform.
        </p>
        <ul className="mt-3 list-disc pl-6 text-slate-700">
          <li>To open problems list go to the Problems section.</li>
          <li>To open the work search platform go to the Jobs section.</li>
        </ul>

        <hr className="my-8" />

        <h2 className="text-xl font-semibold tracking-tight">Problems</h2>
        <p className="mt-3 text-slate-700">
          In Problems you can solve various programming and math tasks. Open a problem, paste your code into the editor
          and submit. The system tests your solution and reports a verdict.
        </p>
        <p className="mt-3 text-slate-700">Testing system uses the following commands:</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">GNU C++23</div>
            <div className="mt-2 rounded-lg border bg-white px-3 py-2 font-mono text-xs text-slate-700">
              g++ -O2 -std=c++23 -DONLINE_JUDGE source.cpp -o source
            </div>
          </div>
          <div className="rounded-xl border bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Python 3.12</div>
            <div className="mt-2 rounded-lg border bg-white px-3 py-2 font-mono text-xs text-slate-700">
              python3.12 source.py
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Verdict</th>
                <th className="px-4 py-3 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr className="bg-white">
                <td className="px-4 py-3 font-mono text-emerald-700">AC</td>
                <td className="px-4 py-3 text-slate-700">Accepted. Program passed all tests.</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 font-mono text-slate-700">IQ</td>
                <td className="px-4 py-3 text-slate-700">In queue. Solution is waiting for testing.</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 font-mono text-amber-700">CE</td>
                <td className="px-4 py-3 text-slate-700">Compilation error.</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 font-mono text-rose-700">WA</td>
                <td className="px-4 py-3 text-slate-700">Wrong answer.</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 font-mono text-rose-700">RE</td>
                <td className="px-4 py-3 text-slate-700">Runtime error.</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 font-mono text-rose-700">TLE</td>
                <td className="px-4 py-3 text-slate-700">Time limit exceeded.</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 font-mono text-rose-700">MLE</td>
                <td className="px-4 py-3 text-slate-700">Memory limit exceeded.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <hr className="my-8" />

        <h2 className="text-xl font-semibold tracking-tight">Jobs</h2>
        <p className="mt-3 text-slate-700">In Jobs you can find work and post listings if you have a business account.</p>
        <ol className="mt-3 list-decimal pl-6 text-slate-700">
          <li>Common account: browse jobs and contact employers by email or phone.</li>
          <li className="mt-2">
            Business account: publish, edit or delete jobs, and communicate with candidates.
          </li>
        </ol>

        <hr className="my-8" />

        <h2 className="text-xl font-semibold tracking-tight">API</h2>
        <p className="mt-3 text-slate-700">The web app uses internal APIs behind the frontend; they are not public.</p>
      </div>
    </Container>
  );
}
