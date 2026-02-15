import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Download, Link2 } from "lucide-react";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const workspaceId = session!.user.workspaceId;

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
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/dashboard/gallery"
        className="inline-flex items-center gap-2 text-sm text-[#4A4A4A] hover:text-[#1A1A1A]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Gallery
      </Link>

      <div className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white shadow-sm">
        {quote.imageUrl ? (
          <div className="aspect-square bg-gradient-to-br from-violet-100 to-orange-100" />
        ) : (
          <div className="flex aspect-square items-center justify-center bg-gray-50 text-6xl">
            🎨
          </div>
        )}
      </div>

      <div className="space-y-4">
        <p className="font-quote text-xl text-[#1A1A1A]">
          &ldquo;{quote.quoteText}&rdquo;
        </p>
        <div className="flex items-center gap-2 text-sm text-[#4A4A4A]">
          {quote.slackUserAvatarUrl && (
            <Image
              src={quote.slackUserAvatarUrl}
              alt={quote.attributedTo || quote.slackUserName}
              width={24}
              height={24}
              className="rounded-full"
            />
          )}
          <p>
            {quote.attributedTo && <span>— {quote.attributedTo} · </span>}#
            {quote.channel.channelName} ·{" "}
            {new Date(quote.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        {style && (
          <p className="text-sm text-[#4A4A4A]">Style: {style.displayName}</p>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" size="sm">
            <Heart className="mr-2 h-4 w-4" />
            Favorite
          </Button>
          {quote.imageUrl && (
            <a href={quote.imageUrl} download>
              <Button variant="secondary" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </a>
          )}
          <Button variant="secondary" size="sm">
            <Link2 className="mr-2 h-4 w-4" />
            Share Link
          </Button>
        </div>
      </div>
    </div>
  );
}
