import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { assertUser } from "@/lib/user";
import { OnboardingWizard } from "./onboarding-wizard";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string }>;
}) {
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

  const { workspaceId: workspaceIdParam } = await searchParams;

  // Use the workspace from the query param if provided, otherwise find the first incomplete one
  let workspaceId = workspaceIdParam;
  if (workspaceId) {
    // If a specific workspace was requested, check if it already completed onboarding
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { slug: true, onboardingCompleted: true },
    });
    if (workspace?.onboardingCompleted) {
      redirect(`/${workspace.slug}`);
    }
  } else {
    const workspaceUser = await prisma.workspaceUser.findFirst({
      where: { userId, workspace: { onboardingCompleted: false } },
      select: { workspaceId: true },
    });
    workspaceId = workspaceUser?.workspaceId ?? undefined;
  }

  return (
    <OnboardingWizard
      authType={session.user.authType}
      userId={userId}
      workspaceId={workspaceId}
    />
  );
}
