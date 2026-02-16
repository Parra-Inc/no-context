import prisma from "@/lib/prisma";
import { generateCheckoutToken } from "@/lib/id";

export async function getOrCreateCheckoutToken(
  workspaceId: string,
): Promise<string> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { checkoutToken: true },
  });

  if (workspace?.checkoutToken) {
    return workspace.checkoutToken;
  }

  const token = generateCheckoutToken();
  const updated = await prisma.workspace.update({
    where: { id: workspaceId },
    data: { checkoutToken: token },
    select: { checkoutToken: true },
  });

  return updated.checkoutToken!;
}
