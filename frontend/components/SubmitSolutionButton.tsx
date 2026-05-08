"use client";

import { useFormStatus } from "react-dom";

export default function SubmitSolutionButton() {
  const { pending } = useFormStatus();

  return (
    <button
      aria-live="polite"
      className="inline-flex h-11 min-w-36 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
      ) : null}
      {pending ? "Submitting..." : "Submit Solution"}
    </button>
  );
}
