"use server";

import { signIn } from "@/lib/auth";

export async function signInWithSlack() {
  await signIn("slack", { redirectTo: "/dashboard" });
}
