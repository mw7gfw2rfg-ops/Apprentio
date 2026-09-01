import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccentColorPicker } from "@/components/accent-color-picker";
import { DEFAULT_ACCENT_COLOR } from "@/lib/accent-color";
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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8 sm:py-10">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Personalise how Apprentio looks for you.
        </p>
      </div>

      {error && (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-2xl border border-[var(--warm-sage-border)] bg-[var(--warm-sage)] px-4 py-3 text-sm font-semibold text-[var(--warm-sage-foreground)]">
          {success}
        </p>
      )}

      <div className="rounded-[24px_20px_26px_22px] border border-border bg-card p-6 shadow-[0_24px_42px_-30px_rgba(96,74,52,0.5)]">
        <div>
          <h2 className="font-heading text-lg font-bold">Accent color</h2>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            Used for the active nav item, focus rings, and the highlight under primary
            buttons — in both light and dark mode. Text color on it is chosen
            automatically for contrast.
          </p>
        </div>
        <AccentColorPicker
          initialColor={profile?.accent_color ?? DEFAULT_ACCENT_COLOR}
          updateAccentColor={updateAccentColor}
          resetAccentColor={resetAccentColor}
        />
      </div>
    </div>
  );
}
