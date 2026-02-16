import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { assertUser } from "@/lib/user";
import { OnboardingWizard } from "./onboarding-wizard";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  // Ensure the user record exists in the DB (create if missing)
  const userId = await assertUser({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    slackUserId: session.user.slackUserId,
    authType: session.user.authType,
  });

  // Check if the user already has a workspace via WorkspaceUser
  const workspaceUser = await prisma.workspaceUser.findFirst({
    where: { userId },
    select: { workspaceId: true },
  });

  return (
    <OnboardingWizard
      authType={session.user.authType}
      userId={userId}
      workspaceId={workspaceUser?.workspaceId}
    />
  );
}
