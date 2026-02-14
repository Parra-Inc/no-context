"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import { ART_STYLES } from "@/lib/styles";

const steps = ["Welcome", "Channel", "Invite Bot", "Choose Style", "Done"];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [channelName, setChannelName] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("watercolor");

  const next = () => setCurrentStep((s) => Math.min(s + 1, steps.length - 1));

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div className="flex justify-center gap-2">
        {steps.map((step, i) => (
          <div
            key={step}
            className={`h-2 w-12 rounded-full ${i <= currentStep ? "bg-[#7C3AED]" : "bg-gray-200"}`}
          />
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {currentStep === 0 && (
            <div className="space-y-4 text-center">
              <div className="text-5xl">🎨</div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">
                No Context is installed!
              </h2>
              <p className="text-[#4A4A4A]">
                Let&apos;s get you set up in just a few steps.
              </p>
              <Button onClick={next} className="w-full">
                Let&apos;s Go
              </Button>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#1A1A1A]">
                Connect a channel
              </h2>
              <p className="text-sm text-[#4A4A4A]">
                Which channel should No Context watch for quotes?
              </p>
              <input
                type="text"
                placeholder="e.g., no-context"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="w-full rounded-xl border border-[#E5E5E5] px-4 py-2.5 text-sm focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] focus:outline-none"
              />
              <Button onClick={next} disabled={!channelName} className="w-full">
                Continue
              </Button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#1A1A1A]">
                Invite the bot
              </h2>
              <p className="text-sm text-[#4A4A4A]">
                In your Slack channel, type:
              </p>
              <div className="rounded-lg bg-gray-50 p-3">
                <code className="text-sm text-[#1A1A1A]">
                  /invite @No Context
                </code>
              </div>
              <p className="text-sm text-[#4A4A4A]">
                This allows the bot to see messages in the channel.
              </p>
              <Button onClick={next} className="w-full">
                I&apos;ve Invited the Bot
              </Button>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#1A1A1A]">
                Choose a style
              </h2>
              <p className="text-sm text-[#4A4A4A]">
                Pick the default art style for your quotes.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {ART_STYLES.slice(0, 9).map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`rounded-xl border p-3 text-center text-xs transition-all ${
                      selectedStyle === style.id
                        ? "border-[#7C3AED] bg-[#EDE9FE]"
                        : "border-[#E5E5E5] hover:border-[#7C3AED]"
                    }`}
                  >
                    {style.displayName}
                  </button>
                ))}
              </div>
              <Button onClick={next} className="w-full">
                Continue
              </Button>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">
                You&apos;re all set!
              </h2>
              <p className="text-[#4A4A4A]">
                Post a quote in #{channelName || "no-context"} and watch the
                magic happen.
              </p>
              <a href="/dashboard">
                <Button className="w-full">Go to Dashboard</Button>
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
