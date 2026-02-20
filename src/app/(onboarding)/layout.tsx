import { auth } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { assertUser } from "@/lib/user";
import { LogOut } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  // Email auth users must verify before onboarding
  if (session.user.authType === "email" && !session.user.isEmailVerified) {
    redirect(
      `/auth/verify-email?userId=${session.user.id}&email=${encodeURIComponent(session.user.email || "")}`,
    );
  }

  // Ensure the user record exists in the DB (create if missing)
  const userId = await assertUser({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    slackUserId: session.user.slackUserId,
    authType: session.user.authType,
  });

  // Only redirect away if ALL of the user's workspaces have completed onboarding
  const incompleteWorkspace = await prisma.workspaceUser.findFirst({
    where: {
      userId,
      workspace: { onboardingCompleted: false },
    },
  });

  if (!incompleteWorkspace) {
    redirect("/workspaces");
  }

  const user = session.user;

  return (
    <div className="relative min-h-screen bg-[#fafaf8]">
      <div className="absolute top-4 right-4">
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] transition-shadow hover:shadow-[3px_3px_0px_0px_#1A1A1A] focus:outline-none">
              {user.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.image}
                  alt={user.name || "User"}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span className="bg-primary text-primary-foreground flex h-full w-full items-center justify-center rounded-full text-xs font-bold">
                  {user.name?.[0]?.toUpperCase() || "?"}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-52 p-3">
            <div className="space-y-3">
              <div className="truncate text-sm font-medium text-[#1A1A1A]">
                {user.name || user.email}
              </div>
              <Link
                href="/logout"
                className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Link>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md px-4 py-8">{children}</div>
      </div>
    </div>
  );
}
