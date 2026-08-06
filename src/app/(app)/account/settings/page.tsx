import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccentColorPicker } from "@/components/accent-color-picker";
import { updateAccentColor, resetAccentColor } from "./actions";

export default async function AccountSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("accent_color")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Personalise how Apprentio looks for you.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          {success}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Accent color
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Used for primary buttons, the active nav item, and focus states — in both
            light and dark mode. Text color on it is chosen automatically for contrast.
          </p>
        </div>
        <AccentColorPicker
          initialColor={profile?.accent_color ?? "#4f46e5"}
          updateAccentColor={updateAccentColor}
          resetAccentColor={resetAccentColor}
        />
      </div>
    </div>
  );
}
