import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { CheckoutContent } from "./checkout-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buy Extra Images | No Context",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({
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
    },
  });

  if (!workspace) {
    notFound();
  }

  return (
    <CheckoutContent
      token={token}
      workspaceName={workspace.slackTeamName}
      workspaceIcon={workspace.slackTeamIcon}
    />
  );
}
