import prisma from "@/lib/prisma";

export interface DbStyle {
  id: string;
  workspaceId: string | null;
  name: string;
  displayName: string;
  description: string;
}

export async function getEnabledStylesForChannel(
  channelId: string,
  workspaceId: string,
): Promise<DbStyle[]> {
  const disabledStyleIds = await prisma.channelStyle.findMany({
    where: { channelId },
    select: { styleId: true },
  });

  const disabledIds = new Set(disabledStyleIds.map((cs) => cs.styleId));

  const allStyles = await prisma.style.findMany({
    where: {
      isActive: true,
      OR: [{ workspaceId: null }, { workspaceId }],
    },
    orderBy: { createdAt: "asc" },
  });

  return allStyles.filter((s) => !disabledIds.has(s.id));
}

export function pickRandomStyle<T>(styles: T[]): T {
  return styles[Math.floor(Math.random() * styles.length)];
}
