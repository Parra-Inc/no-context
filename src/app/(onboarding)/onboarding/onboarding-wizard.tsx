"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogoIcon } from "@/components/logo";
import { Check, Loader2, RefreshCw } from "lucide-react";

interface SlackChannel {
  id: string;
  name: string;
}

interface OnboardingWizardProps {
  authType: "slack" | "email";
  userId: string;
  workspaceId?: string;
}

const steps = ["Connect Slack", "Invite Bot", "Connect Channel", "Done"];

function SlackLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 2447.6 2452.5"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g clipRule="evenodd" fillRule="evenodd">
        <path
          d="m897.4 0c-135.3.1-244.8 109.9-244.7 245.2-.1 135.3 109.5 245.1 244.8 245.2h244.8v-245.1c.1-135.3-109.5-245.1-244.9-245.3.1 0 .1 0 0 0m0 654h-652.6c-135.3.1-244.9 109.9-244.8 245.2-.2 135.3 109.4 245.1 244.7 245.3h652.7c135.3-.1 244.9-109.9 244.8-245.2.1-135.4-109.5-245.2-244.8-245.3z"
          fill="#36c5f0"
        />
        <path
          d="m2447.6 899.2c.1-135.3-109.5-245.1-244.8-245.2-135.3.1-244.9 109.9-244.8 245.2v245.3h244.8c135.3-.1 244.9-109.9 244.8-245.3zm-652.7 0v-654c.1-135.2-109.4-245-244.7-245.2-135.3.1-244.9 109.9-244.8 245.2v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.3z"
          fill="#2eb67d"
        />
        <path
          d="m1550.1 2452.5c135.3-.1 244.9-109.9 244.8-245.2.1-135.3-109.5-245.1-244.8-245.2h-244.8v245.2c-.1 135.2 109.5 245 244.8 245.2zm0-654.1h652.7c135.3-.1 244.9-109.9 244.8-245.2.2-135.3-109.4-245.1-244.7-245.3h-652.7c-135.3.1-244.9 109.9-244.8 245.2-.1 135.4 109.4 245.2 244.7 245.3z"
          fill="#ecb22e"
        />
        <path
          d="m0 1553.2c-.1 135.3 109.5 245.1 244.8 245.2 135.3-.1 244.9-109.9 244.8-245.2v-245.2h-244.8c-135.3.1-244.9 109.9-244.8 245.2zm652.7 0v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.2v-653.9c.2-135.3-109.4-245.1-244.7-245.3-135.4 0-244.9 109.8-244.8 245.1 0 0 0 .1 0 0"
          fill="#e01e5a"
        />
      </g>
    </svg>
  );
}

function ConnectionVisual({ connected = false }: { connected?: boolean }) {
  return (
    <div className="flex items-center justify-center gap-0 py-2">
      {/* Slack Logo */}
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-[#1A1A1A] bg-white shadow-[3px_3px_0px_0px_#1A1A1A]">
        <SlackLogo className="h-10 w-10" />
      </div>

      {/* Connection Line */}
      <div className="relative flex w-28 items-center justify-center">
        <svg className="h-8 w-full" viewBox="0 0 112 32" fill="none">
          {connected ? (
            <>
              <line
                x1="4"
                y1="16"
                x2="108"
                y2="16"
                stroke="#22c55e"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="56" cy="16" r="10" fill="#22c55e" />
              <path
                d="M50 16l4 4 8-8"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </>
          ) : (
            <>
              <line
                x1="4"
                y1="16"
                x2="108"
                y2="16"
                stroke="#7C3AED"
                strokeWidth="2"
                strokeDasharray="6 5"
                strokeLinecap="round"
                className="animate-dash-flow"
              />
              {/* Small animated dots */}
              <circle cx="0" cy="16" r="3" fill="#7C3AED" opacity="0.6">
                <animate
                  attributeName="cx"
                  from="4"
                  to="108"
                  dur="2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0;0.8;0.8;0"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
            </>
          )}
        </svg>
      </div>

      {/* No Context Logo */}
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-[#1A1A1A] bg-white shadow-[3px_3px_0px_0px_#1A1A1A]">
        <LogoIcon className="h-12 w-12" />
      </div>
    </div>
  );
}

export function OnboardingWizard({
  authType,
  userId,
  workspaceId,
}: OnboardingWizardProps) {
  const router = useRouter();

  // If workspace already linked, skip to "Invite Bot" (step 1)
  const [currentStep, setCurrentStep] = useState(workspaceId ? 1 : 0);
  const [slackChannels, setSlackChannels] = useState<SlackChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const next = () => setCurrentStep((s) => Math.min(s + 1, steps.length - 1));

  function handleLinkWorkspace() {
    const returnTo = workspaceId
      ? `/onboarding?workspaceId=${workspaceId}`
      : "/onboarding";
    const params = new URLSearchParams({ returnTo });
    if (authType === "email") {
      params.set("userId", userId);
    }
    window.location.href = `/api/slack/install?${params.toString()}`;
  }

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/settings/slack-channels", {
        headers: workspaceId ? { "X-Workspace-Id": workspaceId } : {},
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setSlackChannels(data);
      }
    } catch {
      setError("Failed to load channels");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (currentStep === 2) {
      fetchChannels();
    }
  }, [currentStep, fetchChannels]);

  async function handleConnectChannel() {
    const channel = slackChannels.find((ch) => ch.id === selectedChannelId);
    if (!channel) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/settings/channels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(workspaceId ? { "X-Workspace-Id": workspaceId } : {}),
        },
        body: JSON.stringify({
          slackChannelId: channel.id,
          channelName: channel.name,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to connect channel");
        return;
      }
      next();
    } catch {
      setError("Failed to connect channel");
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete() {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: workspaceId ? { "X-Workspace-Id": workspaceId } : {},
      });
      const data = await res.json();
      router.push(data.slug ? `/${data.slug}` : "/workspaces");
    } catch {
      setError("Failed to complete onboarding");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                i < currentStep
                  ? "border-[#22c55e] bg-[#22c55e] text-white"
                  : i === currentStep
                    ? "border-[#7C3AED] bg-[#7C3AED] text-white"
                    : "border-[#e5e5e5] bg-white text-[#4A4A4A]"
              }`}
            >
              {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 w-8 rounded-full transition-colors ${
                  i < currentStep ? "bg-[#22c55e]" : "bg-[#e5e5e5]"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="rounded-2xl border-2 border-[#1A1A1A] bg-white p-8 shadow-[4px_4px_0px_0px_#1A1A1A]">
        {/* Step 0: Connect Slack */}
        {currentStep === 0 && (
          <div className="space-y-6 text-center">
            <ConnectionVisual />

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#1A1A1A]">
                Connect your Slack workspace
              </h2>
              <p className="text-muted-foreground text-sm">
                Install the No Context bot to start turning your team&apos;s
                best quotes into art.
              </p>
            </div>

            <Button
              onClick={handleLinkWorkspace}
              size="lg"
              className="w-full gap-3 text-base"
            >
              <SlackLogo className="h-5 w-5" />
              Add to Slack
            </Button>
          </div>
        )}

        {/* Step 1: Invite Bot */}
        {currentStep === 1 && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[#1A1A1A] bg-[#EDE9FE] shadow-[3px_3px_0px_0px_#1A1A1A]">
              <LogoIcon className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#1A1A1A]">
                Invite the bot to a channel
              </h2>
              <p className="text-muted-foreground text-sm">
                In a Slack channel you want No Context to watch, type:
              </p>
            </div>

            <div className="rounded-xl border-2 border-[#e5e5e5] bg-[#fafaf8] px-4 py-3">
              <code className="text-sm font-semibold text-[#7C3AED]">
                /invite @No Context
              </code>
            </div>

            <p className="text-muted-foreground text-xs">
              This lets the bot see messages in the channel. You can always add
              more channels later in Settings.
            </p>

            <Button onClick={next} size="lg" className="w-full text-base">
              I&apos;ve Invited the Bot
            </Button>
          </div>
        )}

        {/* Step 2: Connect Channel */}
        {currentStep === 2 && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[#1A1A1A] bg-[#EDE9FE] shadow-[3px_3px_0px_0px_#1A1A1A]">
              <span className="text-2xl font-bold text-[#7C3AED]">#</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#1A1A1A]">
                Pick a channel
              </h2>
              <p className="text-muted-foreground text-sm">
                Select a channel where you&apos;ve invited the bot.
              </p>
            </div>

            {loading && slackChannels.length === 0 ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-[#7C3AED]" />
              </div>
            ) : slackChannels.length === 0 ? (
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  No channels found yet. Make sure you&apos;ve invited the bot,
                  then refresh.
                </p>
                <Button
                  variant="outline"
                  onClick={fetchChannels}
                  size="lg"
                  className="w-full gap-2 border-2 text-base"
                >
                  <RefreshCw className="h-4 w-4" /> Refresh Channels
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <select
                  value={selectedChannelId}
                  onChange={(e) => setSelectedChannelId(e.target.value)}
                  className="w-full rounded-xl border-2 border-[#1A1A1A] bg-white px-4 py-3 text-sm font-medium shadow-[2px_2px_0px_0px_#1A1A1A] transition-shadow focus:border-[#7C3AED] focus:shadow-[3px_3px_0px_0px_#7C3AED] focus:outline-none"
                >
                  <option value="">Select a channel...</option>
                  {slackChannels.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      # {ch.name}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={handleConnectChannel}
                  disabled={!selectedChannelId || loading}
                  size="lg"
                  className="w-full gap-2 text-base"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Connect Channel
                </Button>
              </div>
            )}
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        )}

        {/* Step 3: Done */}
        {currentStep === 3 && (
          <div className="space-y-6 text-center">
            <ConnectionVisual connected />

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#1A1A1A]">
                You&apos;re all connected!
              </h2>
              <p className="text-muted-foreground text-sm">
                Start posting quotes and watch the magic happen.
              </p>
            </div>

            <Button
              onClick={handleComplete}
              disabled={loading}
              size="lg"
              className="w-full gap-2 text-base"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>

      {/* Step Label */}
      <p className="text-muted-foreground text-center text-xs font-medium">
        Step {currentStep + 1} of {steps.length} &middot; {steps[currentStep]}
      </p>
    </div>
  );
}
