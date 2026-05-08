"use client";

export default function DeleteJobForm({
  action,
  jobId
}: {
  action: (formData: FormData) => void | Promise<void>;
  jobId: number;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm("Delete this job listing?")) event.preventDefault();
      }}
    >
      <input name="job_id" type="hidden" value={jobId} />
      <button
        className="inline-flex min-h-10 items-center justify-center rounded-[8px] bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700"
        type="submit"
      >
        Delete
      </button>
    </form>
  );
}
