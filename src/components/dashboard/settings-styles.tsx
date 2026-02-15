"use client";

import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Palette, Lock } from "lucide-react";
import { CustomStylesManager } from "@/components/dashboard/custom-styles-manager";

const STYLE_GRADIENTS: Record<string, string> = {
  watercolor: "from-blue-200 via-pink-100 to-yellow-100",
  picasso: "from-amber-200 via-red-200 to-blue-300",
  "van-gogh": "from-yellow-300 via-blue-400 to-indigo-400",
  monet: "from-green-200 via-blue-200 to-pink-200",
  warhol: "from-pink-400 via-yellow-300 to-cyan-300",
  hokusai: "from-blue-300 via-slate-200 to-sky-400",
  dali: "from-orange-200 via-amber-100 to-purple-300",
  mondrian: "from-red-400 via-yellow-300 to-blue-500",
  basquiat: "from-yellow-300 via-red-300 to-black",
  rockwell: "from-amber-200 via-orange-100 to-brown-200",
  ghibli: "from-green-300 via-sky-200 to-blue-200",
  "comic-book": "from-red-300 via-yellow-200 to-blue-300",
  "pixel-art": "from-emerald-300 via-cyan-200 to-purple-300",
  "pencil-sketch": "from-gray-200 via-gray-100 to-gray-300",
  "stained-glass": "from-purple-300 via-rose-200 to-amber-300",
  "kpop-demon-hunters": "from-pink-400 via-purple-400 to-indigo-400",
  fortnite: "from-blue-400 via-purple-300 to-pink-300",
  archer: "from-gray-300 via-red-200 to-gray-400",
  "south-park": "from-green-300 via-blue-200 to-orange-200",
  futurama: "from-purple-300 via-gray-200 to-green-300",
  simpsons: "from-yellow-300 via-yellow-200 to-blue-200",
  fallout: "from-green-400 via-yellow-200 to-amber-300",
};

function getGradient(styleName: string): string {
  return (
    STYLE_GRADIENTS[styleName] || "from-violet-200 via-purple-100 to-pink-200"
  );
}

interface BuiltInStyle {
  id: string;
  name: string;
  displayName: string;
  description: string;
}

interface CustomStyle {
  id: string;
  name: string;
  displayName: string;
  description: string;
}

interface SettingsStylesProps {
  subscriptionTier: string;
  builtInStyles: BuiltInStyle[];
  customStyles: CustomStyle[];
  canCreateCustom: boolean;
  onNavigateTab?: (tab: string) => void;
}

export function SettingsStyles({
  subscriptionTier,
  builtInStyles,
  customStyles,
  canCreateCustom,
  onNavigateTab,
}: SettingsStylesProps) {
  return (
    <div className="space-y-8">
      <p className="text-sm text-[#4A4A4A]">
        {builtInStyles.length + customStyles.length} styles available
      </p>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <CardTitle>Built-in Styles</CardTitle>
            <CardDescription className="mt-1">
              Pre-configured art styles available to all plans
            </CardDescription>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {builtInStyles.map((style) => (
              <div
                key={style.id}
                className="group overflow-hidden rounded-xl border border-[#E5E5E5] transition-shadow hover:shadow-md"
              >
                <div
                  className={`flex aspect-[3/2] items-center justify-center bg-gradient-to-br ${getGradient(style.name)}`}
                >
                  <Palette className="h-8 w-8 text-white/60" />
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium text-[#1A1A1A]">
                    {style.displayName}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-[#4A4A4A]">
                    {style.description}
                  </p>
                </div>
              </div>
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
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#E5E5E5] py-8">
              <Palette className="h-8 w-8 text-[#D4D4D4]" />
              <p className="mt-2 text-sm text-[#4A4A4A]">
                Custom styles are available on Team and Business plans.
              </p>
              <button
                type="button"
                onClick={() => onNavigateTab?.("billing")}
                className="mt-2 text-sm text-[#7C3AED] hover:underline"
              >
                View plans
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
