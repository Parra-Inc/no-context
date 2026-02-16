import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { SettingsStyles } from "@/components/dashboard/settings-styles";

export default async function StylesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const workspaceId = session.user.workspaceId;

  if (!workspaceId) {
    redirect("/onboarding");
  }

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
