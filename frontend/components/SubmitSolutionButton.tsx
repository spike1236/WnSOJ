"use client";

import { useFormStatus } from "react-dom";

export default function SubmitSolutionButton() {
  const { pending } = useFormStatus();

  return (
    <button
      aria-live="polite"
      className="action-primary min-w-36 gap-2 disabled:cursor-wait disabled:opacity-70"
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
