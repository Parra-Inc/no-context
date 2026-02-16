import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Toaster } from "sonner";
import { assertWorkspace } from "@/lib/workspace";
import { WorkspaceProvider } from "@/components/workspace-context";

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

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
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

  const { workspaceSlug } = await params;
  const { workspace } = await assertWorkspace(session.user.id, workspaceSlug);

  if (!workspace.onboardingCompleted) {
    redirect(`/onboarding?workspaceId=${workspace.id}`);
  }

  const [subscription, usage] = await Promise.all([
    prisma.subscription.findUnique({
      where: { workspaceId: workspace.id },
      select: { tier: true, monthlyQuota: true, currentPeriodEnd: true },
    }),
    prisma.usageRecord.findFirst({
      where: {
        workspaceId: workspace.id,
        periodStart: new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1,
        ),
      },
      select: { quotesUsed: true },
    }),
  ]);

  const tier = subscription?.tier || "FREE";
  const quota = subscription?.monthlyQuota || 5;
  const used = usage?.quotesUsed || 0;

  return (
    <WorkspaceProvider workspaceId={workspace.id} workspaceSlug={workspaceSlug}>
      <SidebarProvider>
        <AppSidebar
          user={session.user}
          workspaceSlug={workspaceSlug}
          workspaceName={workspace.slackTeamName}
          subscriptionTier={tier}
          usageQuota={quota}
          usageUsed={used}
          workspaceIcon={workspace.slackTeamIcon ?? undefined}
          periodEnd={subscription?.currentPeriodEnd?.toISOString()}
        />
        <main className="bg-background flex-1 overflow-auto">
          <div className="bg-background/80 sticky top-0 z-10 flex h-14 items-center border-b px-6 backdrop-blur-sm md:hidden">
            <SidebarTrigger />
          </div>
          <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
        </main>
        <Toaster position="bottom-right" richColors />
      </SidebarProvider>
    </WorkspaceProvider>
  );
}
