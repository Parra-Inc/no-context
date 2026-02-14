import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default async function BillingPage() {
  const session = await auth();
  const workspaceId = session!.user.workspaceId;

  const [subscription, usage] = await Promise.all([
    prisma.subscription.findUnique({ where: { workspaceId } }),
    prisma.usageRecord.findFirst({
      where: {
        workspaceId,
        periodStart: new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1,
        ),
      },
    }),
  ]);

  const tier = subscription?.tier || "FREE";
  const quota = subscription?.monthlyQuota || 5;
  const used = usage?.quotesUsed || 0;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[#1A1A1A]">Billing</h1>
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <CardTitle>Current Plan</CardTitle>
            <Badge>{tier}</Badge>
          </div>
          <div>
            <div className="flex justify-between text-sm">
              <span className="text-[#4A4A4A]">Usage this month</span>
              <span className="font-medium text-[#1A1A1A]">
                {used} / {quota}
              </span>
            </div>
            <Progress value={used} max={quota} className="mt-2" />
          </div>
          {subscription?.currentPeriodEnd && (
            <p className="text-sm text-[#4A4A4A]">
              Current period ends:{" "}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          )}
          <div className="flex gap-3">
            <Button variant="secondary">Manage Billing</Button>
            {tier === "FREE" && <Button>Upgrade Plan</Button>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
