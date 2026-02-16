"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Image,
  FolderKanban,
  Settings,
  LogOut,
  ChevronsUpDown,
  ShieldCheck,
  ArrowUpRight,
  ArrowLeftRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { FeedbackDialog } from "@/components/dashboard/feedback-dialog";

interface AppSidebarProps {
  user: {
    name: string;
    email?: string;
    image?: string;
    isAdmin?: boolean;
  };
  workspaceSlug: string;
  workspaceName?: string;
  subscriptionTier?: string;
  usageQuota?: number;
  usageUsed?: number;
  workspaceIcon?: string;
  periodEnd?: string;
}

const TIER_LABELS: Record<string, string> = {
  FREE: "Free plan",
  STARTER: "Starter plan",
  TEAM: "Team plan",
  BUSINESS: "Business plan",
};

function getNavItems(workspaceSlug: string) {
  return [
    { href: `/${workspaceSlug}`, label: "Home", icon: Home },
    { href: `/${workspaceSlug}/gallery`, label: "Gallery", icon: Image },
    {
      href: `/${workspaceSlug}/collections`,
      label: "Collections",
      icon: FolderKanban,
    },
    { href: `/${workspaceSlug}/settings`, label: "Settings", icon: Settings },
  ];
}

export function AppSidebar({
  user,
  workspaceSlug,
  workspaceName,
  subscriptionTier = "FREE",
  usageQuota = 5,
  usageUsed = 0,
  workspaceIcon,
  periodEnd,
}: AppSidebarProps) {
  const pathname = usePathname();
  const planLabel = TIER_LABELS[subscriptionTier] || "Free plan";
  const usagePercent = usageQuota > 0 ? (usageUsed / usageQuota) * 100 : 0;
  const navItems = getNavItems(workspaceSlug);
  const basePath = `/${workspaceSlug}`;

  // Calculate reset date
  const resetDate = periodEnd
    ? new Date(periodEnd)
    : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
  const resetLabel = resetDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <Sidebar>
      {/* Logo */}
      <SidebarHeader className="p-4 pb-2">
        <Link href={basePath} className="inline-flex">
          <Logo size="sm" />
        </Link>
      </SidebarHeader>

      {/* Workspace */}
      <div className="px-3 py-1">
        <div className="bg-sidebar-accent/40 flex items-center gap-2.5 rounded-lg border px-3 py-2.5 shadow-sm">
          {workspaceIcon ? (
            <img
              src={workspaceIcon}
              alt={workspaceName || "Workspace"}
              className="h-8 w-8 shrink-0 rounded-lg border object-cover shadow-sm"
            />
          ) : (
            <div className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold shadow-sm">
              {workspaceName?.[0]?.toUpperCase() || "W"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm leading-tight font-semibold">
              {workspaceName || "Workspace"}
            </p>
            <p className="text-muted-foreground mt-0.5 text-[11px] leading-tight">
              Workspace
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== basePath && pathname.startsWith(item.href));
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

      <SidebarFooter className="space-y-3 p-3">
        {/* Usage indicator */}
        <div className="bg-sidebar-accent/50 space-y-3 rounded-lg border px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">{planLabel}</span>
            <span className="text-muted-foreground text-[10px]">
              Resets {resetLabel}
            </span>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[10px]">
                {usageUsed} / {usageQuota} generations
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
          <Link href={`/${workspaceSlug}/settings/billing`} className="block">
            <Button size="sm" className="w-full gap-1.5 text-xs">
              Upgrade plan
              <ArrowUpRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        {/* Switch workspace */}
        <Link
          href="/workspaces"
          className="text-muted-foreground hover:bg-accent hover:text-foreground flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          Switch workspace
        </Link>

        {/* Feedback */}
        <FeedbackDialog userName={user.name} userEmail={user.email} />

        {/* User */}
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
              {workspaceName && (
                <p className="text-muted-foreground text-xs">{workspaceName}</p>
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
