import type { Metadata } from "next";
import Link from "next/link";
import { DEFAULT_BASE_URL } from "@/lib/constants";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_BASE_URL;

export const metadata: Metadata = {
  title: "Blog | No Context",
  description:
    "Tips, guides, and ideas for building better team culture with Slack. Learn about no-context channels, boosting employee morale, and making your workspace more fun.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    type: "website",
    title: "Blog | No Context",
    description:
      "Tips, guides, and ideas for building better team culture with Slack.",
    url: `${baseUrl}/blog`,
  },
};

const posts = [
  {
    slug: "make-slack-fun-for-employees",
    title: "15 Ways to Make Your Slack Workspace More Fun for Employees",
    description:
      "Boost team morale and make work more enjoyable with these 15 creative, low-effort ideas — from custom emoji to no-context channels.",
    tag: "Team Culture Guide",
    date: "February 15, 2026",
  },
  {
    slug: "what-is-a-no-context-channel",
    title: "What Is a #no-context Channel? The Complete Guide",
    description:
      "A #no-context channel is a Slack channel where your team posts the funniest things people say at work — completely out of context. Learn how to start one.",
    tag: "The Complete Guide",
    date: "February 15, 2026",
  },
];

export default function BlogPage() {
  return (
    <div className="pb-16 sm:pb-24">
      <header className="px-4 pt-28 pb-12 sm:px-6 sm:pt-36 sm:pb-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl leading-tight tracking-tight text-[#1A1A1A] md:text-5xl lg:text-6xl">
            Blog
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-[#4A4A4A]">
            Tips, guides, and ideas for building better team culture with Slack.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="space-y-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block rounded-2xl border-2 border-[#1A1A1A] bg-white p-6 shadow-[4px_4px_0px_0px_#1A1A1A] transition-shadow hover:shadow-[6px_6px_0px_0px_#1A1A1A] sm:p-8"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[#EDE9FE] px-3 py-1 text-xs font-semibold tracking-wide text-[#7C3AED] uppercase">
                  {post.tag}
                </span>
                <span className="text-sm text-[#4A4A4A]">{post.date}</span>
              </div>
              <h2 className="font-display mt-3 text-xl text-[#1A1A1A] md:text-2xl">
                {post.title}
              </h2>
              <p className="mt-2 leading-relaxed text-[#4A4A4A]">
                {post.description}
              </p>
              <p className="mt-4 text-sm font-semibold text-[#7C3AED]">
                Read more &rarr;
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
