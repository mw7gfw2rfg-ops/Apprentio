"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_ACCENT_COLOR, isValidHexColor } from "@/lib/accent-color";

export async function updateAccentColor(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const raw = formData.get("accent_color");
  const value = typeof raw === "string" ? raw.trim() : "";

  if (!isValidHexColor(value)) {
    redirect(
      `/account/settings?error=${encodeURIComponent("Enter a valid 6-digit hex color")}`
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({ accent_color: value })
    .eq("user_id", user.id);

  if (error) {
    redirect(`/account/settings?error=${encodeURIComponent(error.message)}`);
  }

  // Accent tokens are injected in the (app) layout, so every page under it
  // needs to pick up the change, not just this one.
  revalidatePath("/", "layout");
  redirect("/account/settings?success=Accent+color+updated");
}

export async function resetAccentColor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ accent_color: DEFAULT_ACCENT_COLOR })
    .eq("user_id", user.id);

  if (error) {
    redirect(`/account/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/account/settings?success=Reset+to+default");
}
