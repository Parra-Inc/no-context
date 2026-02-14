"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Image,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user: {
    name: string;
    image?: string;
    workspaceName?: string;
  };
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/gallery", label: "Gallery", icon: Image },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 rounded-lg bg-white p-2 shadow-md md:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 flex h-screen w-64 flex-col border-r border-[#E5E5E5] bg-white transition-transform md:relative md:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="border-b border-[#E5E5E5] p-6">
          <Link href="/dashboard" className="text-lg font-bold text-[#1A1A1A]">
            No Context
          </Link>
          <p className="mt-1 text-xs text-[#4A4A4A]">{user.workspaceName}</p>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-[#EDE9FE] font-medium text-[#7C3AED]"
                        : "text-[#4A4A4A] hover:bg-gray-50",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-[#E5E5E5] p-4">
          <div className="flex items-center gap-3">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7C3AED] text-xs font-medium text-white">
                {user.name?.[0] || "?"}
              </div>
            )}
            <p className="flex-1 truncate text-sm font-medium text-[#1A1A1A]">
              {user.name}
            </p>
          </div>
          <Link
            href="/api/auth/signout"
            className="mt-3 flex items-center gap-2 text-xs text-[#4A4A4A] hover:text-[#1A1A1A]"
          >
            <LogOut className="h-3 w-3" /> Sign out
          </Link>
        </div>
      </aside>
    </>
  );
}
