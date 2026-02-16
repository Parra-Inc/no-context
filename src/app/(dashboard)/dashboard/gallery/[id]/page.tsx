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
    include: { channel: { select: { channelName: true } } },
  });

  if (!quote) notFound();

  const style = await prisma.style.findFirst({
    where: { name: quote.styleId, isActive: true },
  });

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
        styleName: style?.displayName || null,
      }}
    />
  );
}
