import prisma from "@/lib/prisma";
import { AdminStylesManager } from "@/components/admin/admin-styles-manager";

export default async function AdminStylesPage() {
  const styles = await prisma.style.findMany({
    where: { workspaceId: null },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { channelStyles: true } },
    },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[#1A1A1A]">Default Styles</h1>
      <AdminStylesManager
        initialStyles={styles.map((s) => ({
          id: s.id,
          name: s.name,
          displayName: s.displayName,
          description: s.description,
          isActive: s.isActive,
          enabledByDefault: s.enabledByDefault,
          channelStyleCount: s._count.channelStyles,
          createdAt: s.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
