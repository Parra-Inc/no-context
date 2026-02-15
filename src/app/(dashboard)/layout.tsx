import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Toaster } from "sonner";

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

  const [workspace, subscription, usage] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { onboardingCompleted: true },
    }),
    prisma.subscription.findUnique({
      where: { workspaceId },
      select: { tier: true, monthlyQuota: true },
    }),
    prisma.usageRecord.findFirst({
      where: {
        workspaceId,
        periodStart: new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1,
        ),
      },
      select: { quotesUsed: true },
    }),
  ]);

  if (!workspace?.onboardingCompleted) {
    redirect("/onboarding");
  }

  const tier = subscription?.tier || "FREE";
  const quota = subscription?.monthlyQuota || 5;
  const used = usage?.quotesUsed || 0;

  return (
    <SidebarProvider>
      <AppSidebar
        user={session.user}
        subscriptionTier={tier}
        usageQuota={quota}
        usageUsed={used}
      />
      <main className="bg-background flex-1 overflow-auto">
        <div className="bg-background/80 sticky top-0 z-10 flex h-14 items-center border-b px-6 backdrop-blur-sm md:hidden">
          <SidebarTrigger />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
      <Toaster position="bottom-right" richColors />
    </SidebarProvider>
  );
}
