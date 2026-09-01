"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronsUpDown,
  Columns3,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Palette,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "@/app/login/actions";
import { createCheckoutSession, createPortalSession } from "@/app/billing/actions";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/discovery", label: "Discover", icon: Search },
  { href: "/applications", label: "Applications", icon: FileText },
  { href: "/board", label: "Board", icon: Columns3 },
];

export function AppSidebar({
  email,
  isPremium,
  isAdmin,
}: {
  email: string;
  isPremium: boolean;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const initial = email.charAt(0).toUpperCase();
  const { setOpenMobile } = useSidebar();
  const closeMobile = () => setOpenMobile(false);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/dashboard" onClick={closeMobile} />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-[12px_10px_13px_9px] bg-foreground text-background">
                <Logo className="size-5" />
              </div>
              <span className="font-heading text-base font-bold tracking-tight">Apprentio</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} onClick={closeMobile} />}
                    isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link href="/admin" onClick={closeMobile} />}
                    isActive={pathname === "/admin"}
                    tooltip="Admin"
                  >
                    <ShieldCheck />
                    <span>Admin</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="px-1 pb-1 group-data-[collapsible=icon]:hidden">
          <ThemeToggle />
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{email}</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    {isPremium ? "Premium" : "Free"}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-56 rounded-lg" side="top" align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="size-8 rounded-lg">
                        <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                          {initial}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">{email}</span>
                        <Badge
                          variant={isPremium ? "default" : "secondary"}
                          className="mt-0.5 w-fit text-[10px]"
                        >
                          {isPremium ? "Premium" : "Free"}
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <form action={isPremium ? createPortalSession : createCheckoutSession}>
                  <DropdownMenuItem nativeButton render={<button type="submit" className="w-full" />}>
                    <CreditCard />
                    {isPremium ? "Manage subscription" : "Upgrade to Premium"}
                  </DropdownMenuItem>
                </form>
                <DropdownMenuItem render={<Link href="/account/settings" onClick={closeMobile} />}>
                  <Palette />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={<Link href="/account/delete" onClick={closeMobile} />}
                  variant="destructive"
                >
                  <Trash2 />
                  Delete account
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <form action={signOut}>
                  <DropdownMenuItem nativeButton render={<button type="submit" className="w-full" />}>
                    <LogOut />
                    Sign out
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
