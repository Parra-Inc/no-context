"use server";

import { signIn } from "@/lib/auth";

export async function signInWithSlack(
  _prevState: string | null,
): Promise<string | null> {
  try {
    await signIn("slack", { redirectTo: "/dashboard" });
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error; // Re-throw Next.js internal errors (redirect, notFound)
    }
    console.error("Slack sign-in error:", error);
    return "Failed to sign in with Slack. Please try again.";
  }
  return null;
}
