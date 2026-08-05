"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const UNIQUE_VIOLATION = "23505";

export async function saveVacancy(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const vacancyId = formData.get("vacancy_id");
  if (typeof vacancyId !== "string" || !vacancyId) {
    redirect("/discovery?error=Missing vacancy");
  }

  const { error } = await supabase
    .from("applications")
    .insert({ user_id: user.id, vacancy_id: vacancyId, stage: "saved" });

  if (error && error.code !== UNIQUE_VIOLATION) {
    redirect(`/discovery?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/discovery");
}
