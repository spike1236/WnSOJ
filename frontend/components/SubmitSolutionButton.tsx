"use client";

import FormSubmitButton from "@/components/FormSubmitButton";

export default function SubmitSolutionButton() {
  return (
    <FormSubmitButton
      className="inline-flex h-11 items-center justify-center rounded-lg bg-[#304765] px-5 text-sm font-medium text-white hover:bg-[#25374e] disabled:opacity-60"
      idleLabel="Submit Solution"
      pendingLabel="Submitting..."
    />
  );
}
