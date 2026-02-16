"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleStyleEnabled(styleId: string, enabled: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await prisma.style.update({
    where: { id: styleId },
    data: { enabledByDefault: enabled },
  });

  // Revalidate all workspace paths since we don't know the slug in server actions
  revalidatePath("/[workspaceSlug]/settings/styles", "page");
}
