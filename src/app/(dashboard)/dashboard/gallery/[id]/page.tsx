import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { QuoteDetail } from "@/components/dashboard/quote-detail";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const workspaceId = session.user.workspaceId;

  if (!workspaceId) {
    redirect("/onboarding");
  }

  const quote = await prisma.quote.findFirst({
    where: { id, workspaceId },
    include: {
      channel: { select: { channelName: true } },
      imageGenerations: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          styleId: true,
          imageUrl: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (!quote) notFound();

  // Resolve style display names for all generations
  const styleIds = [...new Set(quote.imageGenerations.map((ig) => ig.styleId))];
  const styles = await prisma.style.findMany({
    where: { name: { in: styleIds }, isActive: true },
    select: { name: true, displayName: true },
  });
  const styleNameMap = new Map(styles.map((s) => [s.name, s.displayName]));

  const currentStyle = styleNameMap.get(quote.styleId) || null;

  return (
    <QuoteDetail
      quote={{
        id: quote.id,
        quoteText: quote.quoteText,
        attributedTo: quote.attributedTo,
        slackUserAvatarUrl: quote.slackUserAvatarUrl,
        slackUserName: quote.slackUserName,
        imageUrl: quote.imageUrl,
        isFavorited: quote.isFavorited,
        createdAt: quote.createdAt.toISOString(),
        channelName: quote.channel.channelName,
        styleName: currentStyle,
        status: quote.status,
      }}
      generations={quote.imageGenerations.map((ig) => ({
        id: ig.id,
        styleId: ig.styleId,
        styleName: styleNameMap.get(ig.styleId) || ig.styleId,
        imageUrl: ig.imageUrl,
        status: ig.status,
        createdAt: ig.createdAt.toISOString(),
      }))}
    />
  );
}
