import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "./onboarding-wizard";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  return (
    <OnboardingWizard
      authType={session.user.authType}
      userId={session.user.id}
      workspaceId={session.user.workspaceId}
    />
  );
}
