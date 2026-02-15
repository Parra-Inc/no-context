import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

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

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  if (!session.user.isAdmin) {
    redirect("/dashboard");
  }

  return (
    <SidebarProvider>
      <AdminSidebar user={session.user} />
      <main className="bg-background flex-1 overflow-auto">
        <div className="bg-background/80 sticky top-0 z-10 flex h-14 items-center border-b px-6 backdrop-blur-sm md:hidden">
          <SidebarTrigger />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </SidebarProvider>
  );
}
