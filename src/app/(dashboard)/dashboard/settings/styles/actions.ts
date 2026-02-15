"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleStyleEnabled(styleId: string, enabled: boolean) {
  const session = await auth();
  if (!session?.user?.workspaceId) {
    throw new Error("Unauthorized");
  }

  await prisma.style.update({
    where: { id: styleId },
    data: { enabledByDefault: enabled },
  });

  revalidatePath("/dashboard/settings/styles");
}
