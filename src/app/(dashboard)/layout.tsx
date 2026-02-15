import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  // Email auth users must verify before accessing dashboard
  if (session.user.authType === "email" && !session.user.isEmailVerified) {
    redirect(
      `/auth/verify-email?userId=${session.user.id}&email=${encodeURIComponent(session.user.email || "")}`,
    );
  }

  // The session JWT may not yet reflect a workspace that was just linked.
  // Fall back to a direct DB lookup.
  let workspaceId = session.user.workspaceId;

  if (!workspaceId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { workspaceId: true },
    });
    workspaceId = dbUser?.workspaceId ?? undefined;
  }

  if (!workspaceId) {
    redirect("/onboarding");
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { onboardingCompleted: true },
  });

  if (!workspace?.onboardingCompleted) {
    redirect("/onboarding");
  }

  return (
    <SidebarProvider>
      <AppSidebar user={session.user} />
      <main className="bg-background flex-1 overflow-auto">
        <div className="bg-background/80 sticky top-0 z-10 flex h-14 items-center border-b px-6 backdrop-blur-sm md:hidden">
          <SidebarTrigger />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </SidebarProvider>
  );
}
