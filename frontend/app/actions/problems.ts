"use server";

import { backendFetchForm } from "@/lib/backend.server";
import { redirect } from "next/navigation";

function errorToMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Request failed";
}

export async function createProblemAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const time_limit = String(formData.get("time_limit") ?? "").trim();
  const memory_limit = String(formData.get("memory_limit") ?? "").trim();
  const statement = String(formData.get("statement") ?? "").trim();
  const editorial = String(formData.get("editorial") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const categories = formData.getAll("categories").map((v) => String(v)).filter(Boolean);
  const test_data = formData.get("test_data");

  if (!title || !time_limit || !memory_limit || !statement || !editorial) {
    redirect(`/add_problem?error=${encodeURIComponent("Missing required fields")}`);
  }

  if (!(test_data instanceof File) || test_data.size === 0) {
    redirect(`/add_problem?error=${encodeURIComponent("Missing test data zip")}`);
  }

  if (categories.length === 0) {
    redirect(`/add_problem?error=${encodeURIComponent("Select at least one category")}`);
  }

  const payload = new FormData();
  payload.set("title", title);
  payload.set("time_limit", time_limit);
  payload.set("memory_limit", memory_limit);
  payload.set("statement", statement);
  payload.set("editorial", editorial);
  payload.set("code", code);
  payload.set("test_data", test_data);
  for (const c of categories) payload.append("categories", c);

  try {
    const created = await backendFetchForm<{ id: number }>("/api/problems/", payload, { method: "POST" });
    redirect(`/problem/${created.id}`);
  } catch (e) {
    redirect(`/add_problem?error=${encodeURIComponent(errorToMessage(e))}`);
  }
}
