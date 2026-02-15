import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { OnboardingWizard } from "./onboarding-wizard";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  // The session JWT may not yet reflect a workspace that was just linked
  // (e.g. after the Slack OAuth callback). Fall back to a direct DB lookup.
  let workspaceId = session.user.workspaceId;

  if (!workspaceId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { workspaceId: true },
    });
    workspaceId = dbUser?.workspaceId ?? undefined;
  }

  return (
    <OnboardingWizard
      authType={session.user.authType}
      userId={session.user.id}
      workspaceId={workspaceId}
    />
  );
}
