"use server";

import { signIn } from "@/lib/auth";

export async function signInWithSlack(
  _prevState: string | null,
): Promise<string | null> {
  try {
    await signIn("slack", { redirectTo: "/workspaces" });
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error; // Re-throw Next.js internal errors (redirect, notFound)
    }
    console.error("Slack sign-in error:", error);
    return "Failed to sign in with Slack. Please try again.";
  }
  return null;
}

export async function signInWithEmail(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return "Email and password are required.";
  }

  try {
    await signIn("email", {
      email,
      password,
      redirectTo: "/workspaces",
    });
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    console.error("Email sign-in error:", error);
    return "Invalid email or password.";
  }
  return null;
}
