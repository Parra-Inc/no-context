import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { SettingsStyles } from "@/components/dashboard/settings-styles";
import { assertWorkspace } from "@/lib/workspace";

export default async function StylesPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const { workspaceSlug } = await params;
  const { workspace } = await assertWorkspace(session.user.id, workspaceSlug);
  const workspaceId = workspace.id;

  const [subscription, styles] = await Promise.all([
    prisma.subscription.findUnique({ where: { workspaceId } }),
    prisma.style.findMany({
      where: {
        isActive: true,
        OR: [{ workspaceId: null }, { workspaceId }],
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const tier = subscription?.tier || "FREE";

  const allStyles = styles.map((s) => ({
    id: s.id,
    name: s.name,
    displayName: s.displayName,
    description: s.description,
    prompt: s.prompt,
    isFree: s.isFree,
    enabledByDefault: s.enabledByDefault,
  }));

  return (
    <SettingsStyles
      subscriptionTier={tier}
      builtInStyles={allStyles.filter((s) =>
        styles.find((st) => st.id === s.id && st.workspaceId === null),
      )}
      customStyles={allStyles.filter((s) =>
        styles.find((st) => st.id === s.id && st.workspaceId !== null),
      )}
      canCreateCustom={["TEAM", "BUSINESS"].includes(tier)}
    />
  );
}
