"use client";

import { useState } from "react";
import { Settings, CreditCard, Palette } from "lucide-react";
import SettingsGeneral from "@/components/dashboard/settings-general";
import { SettingsBilling } from "@/components/dashboard/settings-billing";
import { SettingsStyles } from "@/components/dashboard/settings-styles";

type SettingsTab = "general" | "billing" | "styles";

const TABS: { key: SettingsTab; label: string; icon: typeof Settings }[] = [
  { key: "general", label: "General", icon: Settings },
  { key: "billing", label: "Billing", icon: CreditCard },
  { key: "styles", label: "Styles", icon: Palette },
];

interface Channel {
  id: string;
  slackChannelId: string;
  channelName: string;
  isActive: boolean;
  isPaused: boolean;
  styleMode: "RANDOM" | "AI";
  postToChannelId: string | null;
  postToChannelName: string | null;
  disabledStyleIds: string[];
}

interface Style {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isBuiltIn: boolean;
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

interface SettingsTabsProps {
  initialTab?: string;
  general: {
    workspaceName: string;
    needsReconnection: boolean;
    channels: Channel[];
    styles: Style[];
    subscriptionTier: string;
    maxChannels: number;
  };
  billing: {
    tier: string;
    quota: number;
    used: number;
    remaining: number;
    usagePercent: number;
    bonusCredits: number;
    hasStripeCustomer: boolean;
    currentPeriodEnd: string | null;
  };
  styles: {
    subscriptionTier: string;
    builtInStyles: BuiltInStyle[];
    customStyles: CustomStyle[];
    canCreateCustom: boolean;
  };
}

export function SettingsTabs({
  initialTab,
  general,
  billing,
  styles,
}: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    (["general", "billing", "styles"].includes(initialTab || "")
      ? initialTab
      : "general") as SettingsTab,
  );

  function navigateTab(tab: string) {
    if (["general", "billing", "styles"].includes(tab)) {
      setActiveTab(tab as SettingsTab);
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[#1A1A1A]">Settings</h1>

      {/* Tab bar */}
      <div className="flex rounded-xl border-2 border-[#1A1A1A] bg-white shadow-[3px_3px_0px_0px_#1A1A1A]">
        {TABS.map((tab, index) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold transition-colors ${
                index === 0 ? "rounded-l-[10px]" : ""
              } ${index === TABS.length - 1 ? "rounded-r-[10px]" : ""} ${
                activeTab === tab.key
                  ? "bg-[#7C3AED] text-white"
                  : "text-[#4A4A4A] hover:bg-[#F5F0FF]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "general" && (
        <SettingsGeneral
          workspaceName={general.workspaceName}
          needsReconnection={general.needsReconnection}
          channels={general.channels}
          styles={general.styles}
          subscriptionTier={general.subscriptionTier}
          maxChannels={general.maxChannels}
          onNavigateTab={navigateTab}
        />
      )}

      {activeTab === "billing" && (
        <SettingsBilling
          tier={billing.tier}
          quota={billing.quota}
          used={billing.used}
          remaining={billing.remaining}
          usagePercent={billing.usagePercent}
          bonusCredits={billing.bonusCredits}
          hasStripeCustomer={billing.hasStripeCustomer}
          currentPeriodEnd={billing.currentPeriodEnd}
        />
      )}

      {activeTab === "styles" && (
        <SettingsStyles
          subscriptionTier={styles.subscriptionTier}
          builtInStyles={styles.builtInStyles}
          customStyles={styles.customStyles}
          canCreateCustom={styles.canCreateCustom}
          onNavigateTab={navigateTab}
        />
      )}
    </div>
  );
}
