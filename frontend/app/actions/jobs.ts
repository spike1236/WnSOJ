"use server";

import { backendFetchJson } from "@/lib/backend.server";
import { redirect } from "next/navigation";

function errorToMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Request failed";
}

function validMoney(value: number) {
  return Number.isFinite(value) && value >= 0;
}

function validateJobFields({
  title,
  location,
  info,
  currency,
  min,
  max,
  errorPath
}: {
  title: string;
  location: string;
  info: string;
  currency: string;
  min: number;
  max: number | undefined;
  errorPath: string;
}) {
  if (!title || !location || !info) redirect(`${errorPath}?error=${encodeURIComponent("Missing required fields")}`);
  if (title.length > 200) redirect(`${errorPath}?error=${encodeURIComponent("Title is too long")}`);
  if (location.length > 200) redirect(`${errorPath}?error=${encodeURIComponent("Location is too long")}`);
  if (currency !== "$") redirect(`${errorPath}?error=${encodeURIComponent("Invalid currency")}`);
  if (!validMoney(min)) redirect(`${errorPath}?error=${encodeURIComponent("Invalid min salary")}`);
  if (max !== undefined && !validMoney(max)) redirect(`${errorPath}?error=${encodeURIComponent("Invalid max salary")}`);
  if (max !== undefined && min > max) redirect(`${errorPath}?error=${encodeURIComponent("Minimum salary cannot be greater than maximum salary")}`);
}

export async function createJobAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const info = String(formData.get("info") ?? "").trim();
  const minSalaryRaw = String(formData.get("min_salary") ?? "").trim();
  const maxSalaryRaw = String(formData.get("max_salary") ?? "").trim();
  const currency = String(formData.get("currency") ?? "$").trim() || "$";

  const min = minSalaryRaw ? Number(minSalaryRaw) : 0;
  const max = maxSalaryRaw ? Number(maxSalaryRaw) : undefined;
  validateJobFields({ title, location, info, currency, min, max, errorPath: "/add_job" });

  const salary_range = { min, ...(max !== undefined ? { max } : {}), currency };

  let created: { id: number };
  try {
    created = await backendFetchJson<{ id: number }>("/api/jobs/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, location, info, salary_range })
    });
  } catch (e) {
    redirect(`/add_job?error=${encodeURIComponent(errorToMessage(e))}`);
  }

  redirect(`/job/${created.id}`);
}

export async function updateJobAction(formData: FormData) {
  const jobId = Number(formData.get("job_id"));
  if (!Number.isFinite(jobId)) redirect("/jobs");

  const title = String(formData.get("title") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const info = String(formData.get("info") ?? "").trim();
  const minSalaryRaw = String(formData.get("min_salary") ?? "").trim();
  const maxSalaryRaw = String(formData.get("max_salary") ?? "").trim();
  const currency = String(formData.get("currency") ?? "$").trim() || "$";

  const min = minSalaryRaw ? Number(minSalaryRaw) : 0;
  const max = maxSalaryRaw ? Number(maxSalaryRaw) : undefined;
  validateJobFields({ title, location, info, currency, min, max, errorPath: `/job/${jobId}/edit` });

  const salary_range = { min, ...(max !== undefined ? { max } : {}), currency };

  try {
    await backendFetchJson(`/api/jobs/${jobId}/`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, location, info, salary_range })
    });
  } catch (e) {
    redirect(`/job/${jobId}/edit?error=${encodeURIComponent(errorToMessage(e))}`);
  }

  redirect(`/job/${jobId}`);
}

export async function deleteJobAction(formData: FormData) {
  const jobId = Number(formData.get("job_id"));
  if (!Number.isFinite(jobId)) redirect("/jobs");
  try {
    await backendFetchJson(`/api/jobs/${jobId}/`, { method: "DELETE" });
  } catch (e) {
    redirect(`/job/${jobId}?error=${encodeURIComponent(errorToMessage(e))}`);
  }

  redirect("/jobs");
}
