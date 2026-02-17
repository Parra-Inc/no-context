import type { Metadata } from "next";
import { ExploreClient } from "./explore-client";

export const metadata: Metadata = {
  title: "Explore",
  description:
    "Browse AI-generated artwork from out-of-context workplace quotes. Discover hilarious quotes transformed into stunning art across 20+ styles.",
  alternates: {
    canonical: "/explore",
  },
};

export default function ExplorePage() {
  return <ExploreClient />;
}
