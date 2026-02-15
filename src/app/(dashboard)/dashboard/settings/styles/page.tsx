import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function StylesPage() {
  const session = await auth();
  const workspaceId = session!.user.workspaceId;

  const [subscription, styles] = await Promise.all([
    prisma.subscription.findUnique({ where: { workspaceId } }),
    prisma.style.findMany({
      where: {
        isActive: true,
        OR: [{ workspaceId: null }, { workspaceId }],
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const builtInStyles = styles.filter((s) => s.workspaceId === null);
  const customStyles = styles.filter((s) => s.workspaceId !== null);

  const canCreateCustom = ["TEAM", "BUSINESS"].includes(
    subscription?.tier || "FREE",
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[#1A1A1A]">Art Styles</h1>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <CardTitle>Built-in Styles</CardTitle>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {builtInStyles.map((style) => (
              <div
                key={style.id}
                className="rounded-xl border border-[#E5E5E5] p-4"
              >
                <div className="mb-3 aspect-square rounded-lg bg-gradient-to-br from-gray-50 to-gray-100" />
                <p className="text-sm font-medium text-[#1A1A1A]">
                  {style.displayName}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-[#4A4A4A]">
                  {style.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <CardTitle>Custom Styles</CardTitle>
            {!canCreateCustom && (
              <Badge variant="secondary">Team+ plan required</Badge>
            )}
          </div>
          {canCreateCustom ? (
            <div className="space-y-3">
              {customStyles.map((style) => (
                <div
                  key={style.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">
                      {style.displayName}
                    </p>
                    <p className="text-xs text-[#4A4A4A]">
                      {style.description}
                    </p>
                  </div>
                </div>
              ))}
              {customStyles.length === 0 && (
                <p className="text-sm text-[#4A4A4A]">
                  No custom styles yet. Create one to get started!
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-[#4A4A4A]">
              Upgrade to Team or Business to create custom art styles.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
