"use client";

import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/discovery": "Discover apprenticeships",
  "/board": "Application board",
  "/applications": "My applications",
  "/profile": "Edit profile",
  "/account/settings": "Settings",
  "/account/delete": "Delete account",
  "/admin": "Admin",
};

function titleFor(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/vacancies/")) return "Vacancy";
  return "Apprentio";
}

export function AppHeaderTitle({ isPremium }: { isPremium: boolean }) {
  const pathname = usePathname();

  return (
    <>
      <span className="font-heading text-lg font-bold tracking-tight">{titleFor(pathname)}</span>
      <Badge
        className={
          isPremium
            ? "ml-auto h-auto rounded-full border-[var(--warm-peach-border)] bg-[var(--warm-peach)] px-3 py-1 text-xs font-bold text-[var(--warm-peach-foreground)]"
            : "ml-auto h-auto rounded-full border-[var(--warm-sage-border)] bg-[var(--warm-sage)] px-3 py-1 text-xs font-bold text-[var(--warm-sage-foreground)]"
        }
      >
        {isPremium ? "Premium" : "Free"}
      </Badge>
    </>
  );
}
