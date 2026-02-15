import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth/email-verification";
import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata = {
  title: "Verify Email — No Context",
};

export default async function VerifyEmailTokenPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: token } = await params;

  const result = await verifyToken(token);

  if (result.success) {
    redirect("/dashboard");
  }

  // Token invalid or expired
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafaf8] px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <Link href="/">
            <Logo size="lg" className="justify-center" />
          </Link>
        </div>

        <div className="rounded-xl border-2 border-[#1A1A1A] bg-white p-8 shadow-[4px_4px_0px_0px_#1A1A1A]">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <svg
              className="h-8 w-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          <h1 className="font-display text-2xl text-[#1A1A1A]">
            Invalid or Expired Link
          </h1>
          <p className="mt-3 text-[#4A4A4A]">
            This verification link is invalid or has expired. Please request a
            new verification code.
          </p>

          <div className="mt-6">
            <Link
              href="/signin"
              className="font-medium text-[#7C3AED] hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
