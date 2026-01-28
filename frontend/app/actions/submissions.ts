"use server";

import { backendFetchJson } from "@/lib/backend.server";
import { redirect } from "next/navigation";

type CreatedSubmission = { id: number };

function errorToMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Request failed";
}

export async function submitSolutionAction(formData: FormData) {
  const problemId = Number(formData.get("problem_id"));
  const language = String(formData.get("language") ?? "cpp");
  const code = String(formData.get("code") ?? "");

  if (!Number.isFinite(problemId)) redirect("/problems");
  if (!code.trim()) redirect(`/problem/${problemId}?error=${encodeURIComponent("Empty code")}`);

  let created: CreatedSubmission;
  try {
    created = await backendFetchJson<CreatedSubmission>("/api/submissions/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ problem_id: problemId, language, code })
    });
  } catch (e) {
    redirect(`/problem/${problemId}?error=${encodeURIComponent(errorToMessage(e))}`);
  }

  redirect(`/submission/${created.id}`);
}
