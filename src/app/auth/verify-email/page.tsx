import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { EmailVerificationClient } from "./email-verification-client";

export const metadata = {
  title: "Verify Email — No Context",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string; email?: string }>;
}) {
  const params = await searchParams;

  // If the user is signed in via email auth, use their session
  const session = await auth();
  const userId = session?.user?.id || params.userId;
  const email = session?.user?.email || params.email;

  if (!userId || !email) {
    redirect("/signin");
  }

  // If already verified, go to dashboard
  if (session?.user?.isEmailVerified) {
    redirect("/dashboard");
  }

  return <EmailVerificationClient user={{ id: userId, email }} />;
}
