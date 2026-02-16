import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { SuccessContent } from "./success-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Purchase Complete! | No Context",
  robots: { index: false, follow: false },
};

export default async function SuccessPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const workspace = await prisma.workspace.findFirst({
    where: { checkoutToken: token, isActive: true },
    select: {
      slackTeamName: true,
      slackTeamIcon: true,
      subscription: {
        select: {
          bonusCredits: true,
          monthlyQuota: true,
        },
      },
    },
  });

  if (!workspace) {
    notFound();
  }

  return (
    <SuccessContent
      workspaceName={workspace.slackTeamName}
      workspaceIcon={workspace.slackTeamIcon}
      bonusCredits={workspace.subscription?.bonusCredits ?? 0}
      monthlyQuota={workspace.subscription?.monthlyQuota ?? 5}
    />
  );
}
