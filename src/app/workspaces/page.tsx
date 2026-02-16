import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserWorkspaces } from "@/lib/workspace";
import { WorkspaceSelector } from "./workspace-selector";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Select Workspace | No Context",
  robots: { index: false, follow: false },
};

export default async function WorkspacesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const workspaceUsers = await getUserWorkspaces(session.user.id);

  if (workspaceUsers.length === 0) {
    redirect("/onboarding");
  }

  if (workspaceUsers.length === 1) {
    redirect(`/${workspaceUsers[0].workspace.slug}`);
  }

  const workspaces = workspaceUsers.map((wu) => ({
    id: wu.workspace.id,
    slug: wu.workspace.slug,
    name: wu.workspace.slackTeamName,
    icon: wu.workspace.slackTeamIcon,
    role: wu.role,
  }));

  return (
    <WorkspaceSelector workspaces={workspaces} userName={session.user.name} />
  );
}
