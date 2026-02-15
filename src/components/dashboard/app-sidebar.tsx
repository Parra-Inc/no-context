"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Image,
  Settings,
  LogOut,
  ChevronsUpDown,
  Building2,
  ShieldCheck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Logo } from "@/components/logo";
import { Progress } from "@/components/ui/progress";

interface AppSidebarProps {
  user: {
    name: string;
    image?: string;
    workspaceName?: string;
    isAdmin?: boolean;
  };
  subscriptionTier?: string;
  usageQuota?: number;
  usageUsed?: number;
}

const TIER_LABELS: Record<string, string> = {
  FREE: "Free plan",
  STARTER: "Starter plan",
  TEAM: "Team plan",
  BUSINESS: "Business plan",
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/gallery", label: "Gallery", icon: Image },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function AppSidebar({
  user,
  subscriptionTier = "FREE",
  usageQuota = 5,
  usageUsed = 0,
}: AppSidebarProps) {
  const pathname = usePathname();
  const planLabel = TIER_LABELS[subscriptionTier] || "Free plan";
  const usagePercent = usageQuota > 0 ? (usageUsed / usageQuota) * 100 : 0;

  return (
    <Sidebar>
      {/* Logo */}
      <SidebarHeader className="p-4 pb-2">
        <Link href="/dashboard" className="inline-flex">
          <Logo size="sm" />
        </Link>
      </SidebarHeader>

      {/* Workspace */}
      <div className="px-4 py-3">
        <div className="bg-sidebar-accent/50 flex flex-col gap-2.5 rounded-lg border px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm leading-tight font-medium">
                {user.workspaceName || "Workspace"}
              </p>
              <p className="text-muted-foreground text-[11px] leading-tight">
                {planLabel}
              </p>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[10px]">
                {usageUsed} / {usageQuota} images
              </span>
              <span className="text-muted-foreground text-[10px]">
                {Math.round(usagePercent)}%
              </span>
            </div>
            <Progress
              value={usageUsed}
              max={usageQuota}
              className={`mt-1 h-1.5 ${usagePercent >= 90 ? "[&>div]:bg-red-500" : usagePercent >= 70 ? "[&>div]:bg-yellow-500" : ""}`}
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/60 text-[11px] font-semibold tracking-wider uppercase">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {user.isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground/60 text-[11px] font-semibold tracking-wider uppercase">
              Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/admin">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Admin Portal</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* User */}
      <SidebarFooter className="p-3">
        <Popover>
          <PopoverTrigger asChild>
            <button className="hover:bg-sidebar-accent flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                  {user.name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.name}</p>
              </div>
              <ChevronsUpDown className="text-muted-foreground h-4 w-4 shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-56 p-1">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{user.name}</p>
              {user.workspaceName && (
                <p className="text-muted-foreground text-xs">
                  {user.workspaceName}
                </p>
              )}
            </div>
            <div className="bg-border my-1 h-px" />
            <Link
              href="/api/auth/signout"
              className="text-muted-foreground hover:bg-accent hover:text-foreground flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Link>
          </PopoverContent>
        </Popover>
      </SidebarFooter>
    </Sidebar>
  );
}
