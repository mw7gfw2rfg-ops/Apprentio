import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/supabase/profile";
import { isAdminEmail } from "@/lib/admin";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeaderTitle } from "@/components/app-header-title";
import { AccentStyle } from "@/components/accent-style";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await requireProfile<{
    onboarding_complete: boolean;
    subscription_tier: string;
    accent_color: string;
  }>(supabase, user.id, "onboarding_complete, subscription_tier, accent_color");

  if (!profile.onboarding_complete) {
    redirect("/onboarding");
  }

  const isPremium = profile.subscription_tier === "premium";

  return (
    <SidebarProvider>
      <AccentStyle accentColor={profile.accent_color} />
      <AppSidebar
        email={user.email ?? ""}
        isPremium={isPremium}
        isAdmin={isAdminEmail(user.email)}
      />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur-md">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <AppHeaderTitle isPremium={isPremium} />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
