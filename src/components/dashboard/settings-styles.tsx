"use client";

import { useOptimistic, useTransition } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { Palette, Lock, Info, Crown } from "lucide-react";
import { CustomStylesManager } from "@/components/dashboard/custom-styles-manager";
import { toggleStyleEnabled } from "@/app/(app)/[workspaceSlug]/settings/styles/actions";
import { useWorkspace } from "@/components/workspace-context";

function getStyleImagePath(name: string): string {
  return `/images/dashboard/styles/${name}.png`;
}

interface BuiltInStyle {
  id: string;
  name: string;
  displayName: string;
  description: string;
  prompt: string;
  isFree: boolean;
  enabledByDefault: boolean;
}

interface CustomStyle {
  id: string;
  name: string;
  displayName: string;
  prompt: string;
  enabledByDefault: boolean;
}

interface SettingsStylesProps {
  subscriptionTier: string;
  builtInStyles: BuiltInStyle[];
  customStyles: CustomStyle[];
  canCreateCustom: boolean;
}

function StyleCard({
  style,
  locked,
}: {
  style: BuiltInStyle;
  locked: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticEnabled, setOptimisticEnabled] = useOptimistic(
    style.enabledByDefault,
  );

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      setOptimisticEnabled(checked);
      await toggleStyleEnabled(style.id, checked);
    });
  }

  if (locked) {
    return (
      <div className="border-border/50 bg-muted/30 relative overflow-hidden rounded-lg border opacity-60">
        <div className="bg-muted relative aspect-[3/2]">
          <Image
            src={getStyleImagePath(style.name)}
            alt={`${style.displayName} preview`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 33vw"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Lock className="h-5 w-5 text-white drop-shadow" />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 px-2.5 py-2">
          <p className="min-w-0 truncate text-xs font-medium">
            {style.displayName}
          </p>
          <Badge
            variant="secondary"
            className="shrink-0 gap-0.5 px-1.5 py-0 text-[10px] leading-tight"
          >
            <Crown className="h-2.5 w-2.5" />
            Premium
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-lg border transition-all ${
        optimisticEnabled
          ? "border-border bg-background"
          : "border-border/50 bg-muted/30 opacity-50"
      }`}
    >
      <div className="bg-muted relative aspect-[3/2]">
        <Image
          src={getStyleImagePath(style.name)}
          alt={`${style.displayName} preview`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, 33vw"
        />
      </div>
      <div className="flex items-center justify-between gap-2 px-2.5 py-2">
        <div className="flex min-w-0 items-center gap-1">
          <p className="truncate text-xs font-medium">{style.displayName}</p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="text-muted-foreground h-3 w-3 shrink-0" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                {style.description}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Switch
          checked={optimisticEnabled}
          onCheckedChange={handleToggle}
          disabled={isPending}
        />
      </div>
    </div>
  );
}

export function SettingsStyles({
  subscriptionTier,
  builtInStyles,
  customStyles,
  canCreateCustom,
}: SettingsStylesProps) {
  const { workspaceSlug } = useWorkspace();
  const isFreeTier = subscriptionTier === "FREE";

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Custom Styles</CardTitle>
              <CardDescription className="mt-1">
                Create your own art styles with custom prompts
              </CardDescription>
            </div>
            {!canCreateCustom && (
              <Badge variant="secondary">
                <Lock className="mr-1 h-3 w-3" />
                Team+ required
              </Badge>
            )}
          </div>
          {canCreateCustom ? (
            <CustomStylesManager customStyles={customStyles} />
          ) : (
            <div className="border-border flex flex-col items-center justify-center rounded-xl border border-dashed py-10">
              <Palette className="text-muted-foreground/30 h-8 w-8" />
              <p className="text-muted-foreground mt-2 text-sm">
                Custom styles are available on Team and Business plans.
              </p>
              <Link
                href={`/${workspaceSlug}/settings/billing`}
                className="text-primary mt-2 text-sm hover:underline"
              >
                View plans
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <CardTitle>Built-in Styles</CardTitle>
            <CardDescription className="mt-1">
              {isFreeTier
                ? "Upgrade to a paid plan to unlock all styles"
                : "Pre-configured art styles included with your plan"}
            </CardDescription>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {builtInStyles.map((style) => (
              <StyleCard
                key={style.id}
                style={style}
                locked={isFreeTier && !style.isFree}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
