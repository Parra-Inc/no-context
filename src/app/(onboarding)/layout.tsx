import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
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

  if (!session?.user) {
    redirect("/signin");
  }

  // The session JWT may not yet reflect a workspace that was just linked
  // (e.g. after the Slack OAuth callback). Fall back to a direct DB lookup.
  let workspaceId = session.user.workspaceId;

  if (!workspaceId) {
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

  const user = session.user;

  return (
    <div className="relative min-h-screen bg-[#fafaf8]">
      <div className="absolute top-4 right-4">
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] transition-shadow hover:shadow-[3px_3px_0px_0px_#1A1A1A] focus:outline-none">
              {user.image ? (
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
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </form>
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
