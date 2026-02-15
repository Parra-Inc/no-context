import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  // The session JWT may not yet reflect a workspace that was just linked.
  // Fall back to a direct DB lookup for email auth users.
  let workspaceId = session.user.workspaceId;

  if (!workspaceId && session.user.authType === "email") {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { workspaceId: true },
    });
    workspaceId = dbUser?.workspaceId ?? undefined;
  }

  if (workspaceId) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { onboardingCompleted: true },
    });

    if (workspace?.onboardingCompleted) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafaf8]">
      <div className="w-full max-w-md px-4 py-8">{children}</div>
    </div>
  );
}
