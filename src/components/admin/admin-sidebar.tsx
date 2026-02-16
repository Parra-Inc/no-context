"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Palette,
  LogOut,
  ChevronsUpDown,
  ArrowLeft,
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

interface AdminSidebarProps {
  user: {
    name: string;
    image?: string;
  };
}

const navItems = [{ href: "/admin/styles", label: "Styles", icon: Palette }];

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 pb-2">
        <Link href="/admin" className="inline-flex">
          <Logo size="sm" />
        </Link>
      </SidebarHeader>

      <div className="px-4 py-3">
        <div className="bg-sidebar-accent/50 flex items-center gap-2.5 rounded-lg border px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-red-500/10 text-red-600">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm leading-tight font-medium">
              Admin Portal
            </p>
            <p className="text-muted-foreground text-[11px] leading-tight">
              Platform Management
            </p>
          </div>
        </div>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/60 text-[11px] font-semibold tracking-wider uppercase">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href);
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
      </SidebarContent>

      <SidebarFooter className="p-3">
        <Link
          href="/workspaces"
          className="text-muted-foreground hover:bg-sidebar-accent flex items-center gap-2.5 rounded-lg p-2 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
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
