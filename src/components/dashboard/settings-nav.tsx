"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, CreditCard, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/components/workspace-context";

export function SettingsNav() {
  const pathname = usePathname();
  const { workspaceSlug } = useWorkspace();

  const tabs = [
    {
      href: `/${workspaceSlug}/settings`,
      label: "General",
      icon: Settings,
      exact: true,
    },
    {
      href: `/${workspaceSlug}/settings/billing`,
      label: "Billing",
      icon: CreditCard,
    },
    {
      href: `/${workspaceSlug}/settings/styles`,
      label: "Styles",
      icon: Palette,
    },
  ];

  return (
    <div
      data-slot="tabs-list"
      className="bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]"
    >
      {tabs.map((tab) => {
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-all",
              "text-foreground/60 hover:text-foreground",
              isActive &&
                "bg-background text-foreground border-input shadow-sm",
            )}
          >
            <tab.icon className="h-4 w-4 shrink-0" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
