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
import Link from "next/link";
import { Palette, Lock } from "lucide-react";
import { CustomStylesManager } from "@/components/dashboard/custom-styles-manager";
import { toggleStyleEnabled } from "@/app/(dashboard)/dashboard/settings/styles/actions";

function getStyleImagePath(name: string): string {
  return `/images/dashboard/styles/${name}.png`;
}

interface BuiltInStyle {
  id: string;
  name: string;
  displayName: string;
  description: string;
  enabledByDefault: boolean;
}

interface CustomStyle {
  id: string;
  name: string;
  displayName: string;
  description: string;
  enabledByDefault: boolean;
}

interface SettingsStylesProps {
  subscriptionTier: string;
  builtInStyles: BuiltInStyle[];
  customStyles: CustomStyle[];
  canCreateCustom: boolean;
}

function StyleRow({
  style,
  hasImage,
}: {
  style: BuiltInStyle | CustomStyle;
  hasImage: boolean;
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

  return (
    <div
      className={`flex items-center gap-4 rounded-lg border p-3 transition-all ${
        optimisticEnabled
          ? "border-border bg-background"
          : "border-border/50 bg-muted/30 opacity-50"
      }`}
    >
      {hasImage ? (
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border">
          <Image
            src={getStyleImagePath(style.name)}
            alt={`${style.displayName} preview`}
            fill
            className="object-cover"
            sizes="48px"
          />
        </div>
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-gradient-to-br from-violet-100 to-purple-100">
          <Palette className="h-5 w-5 text-violet-500" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{style.displayName}</p>
        <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
          {style.description}
        </p>
      </div>
      <Switch
        checked={optimisticEnabled}
        onCheckedChange={handleToggle}
        disabled={isPending}
      />
    </div>
  );
}

export function SettingsStyles({
  subscriptionTier,
  builtInStyles,
  customStyles,
  canCreateCustom,
}: SettingsStylesProps) {
  const enabledCount =
    builtInStyles.filter((s) => s.enabledByDefault).length +
    customStyles.filter((s) => s.enabledByDefault).length;

  return (
    <div className="space-y-8">
      <p className="text-muted-foreground text-sm">
        {enabledCount} of {builtInStyles.length + customStyles.length} styles
        enabled
      </p>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <CardTitle>Built-in Styles</CardTitle>
            <CardDescription className="mt-1">
              Pre-configured art styles available to all plans
            </CardDescription>
          </div>
          <div className="space-y-2">
            {builtInStyles.map((style) => (
              <StyleRow key={style.id} style={style} hasImage={true} />
            ))}
          </div>
        </CardContent>
      </Card>

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
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8">
              <Palette className="text-muted-foreground/30 h-8 w-8" />
              <p className="text-muted-foreground mt-2 text-sm">
                Custom styles are available on Team and Business plans.
              </p>
              <Link
                href="/dashboard/settings/billing"
                className="mt-2 text-sm text-[#7C3AED] hover:underline"
              >
                View plans
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
