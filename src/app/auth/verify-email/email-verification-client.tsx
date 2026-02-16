"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { Input } from "@/components/ui/input";
import {
  verifyCodeAction,
  sendVerificationEmailAction,
} from "@/lib/auth/email-verification-actions";

interface EmailVerificationClientProps {
  user: {
    id: string;
    email: string;
  };
}

export function EmailVerificationClient({
  user,
}: EmailVerificationClientProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  const codeString = code.join("");

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];

    if (value.length > 1) {
      // Handle paste
      const digits = value.slice(0, 6).split("");
      for (let i = 0; i < digits.length && index + i < 6; i++) {
        newCode[index + i] = digits[i];
      }
      setCode(newCode);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (codeString.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setError(null);
    setIsVerifying(true);

    try {
      const result = await verifyCodeAction(user.id, codeString);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/workspaces");
        }, 2000);
      } else {
        setError(result.error || "Invalid verification code.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError(null);
    setResendSuccess(false);

    try {
      const result = await sendVerificationEmailAction(user.id);

      if (result.success) {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 4000);
      } else {
        setError(result.error || "Failed to resend code.");
      }
    } catch {
      setError("Failed to resend code.");
    } finally {
      setIsResending(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafaf8] px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#1A1A1A] bg-[#EDE9FE] shadow-[4px_4px_0px_0px_#1A1A1A]">
            <svg
              className="h-10 w-10 text-[#7C3AED]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="font-display text-2xl text-[#1A1A1A]">
            Email Verified!
          </h2>
          <p className="mt-3 text-[#4A4A4A]">
            Your email has been verified. Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafaf8] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/">
            <Logo size="lg" className="justify-center" />
          </Link>
        </div>

        <div className="rounded-xl border-2 border-[#1A1A1A] bg-white p-8 shadow-[4px_4px_0px_0px_#1A1A1A]">
          {/* Mail icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#EDE9FE]">
            <svg
              className="h-8 w-8 text-[#7C3AED]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h1 className="font-display text-center text-2xl text-[#1A1A1A]">
            Verify Your Email
          </h1>
          <p className="mt-2 text-center text-sm text-[#4A4A4A]">
            We&apos;ve sent a 6-digit code to{" "}
            <span className="font-medium text-[#1A1A1A]">{user.email}</span>
          </p>

          {/* OTP Input */}
          <div className="mt-8">
            <label className="mb-3 block text-center text-sm font-medium text-[#1A1A1A]">
              Enter verification code
            </label>
            <div className="flex justify-center gap-2">
              {code.map((digit, i) => (
                <Input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="h-14 w-12 rounded-xl border-2 border-[#1A1A1A] text-center text-2xl font-bold text-[#7C3AED] shadow-[2px_2px_0px_0px_#1A1A1A] focus:border-[#7C3AED]"
                  autoFocus={i === 0}
                />
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="mt-4 text-center text-sm text-red-600">{error}</p>
          )}

          {/* Resend success */}
          {resendSuccess && (
            <p className="mt-4 text-center text-sm text-[#7C3AED]">
              New code sent! Check your email.
            </p>
          )}

          {/* Verify button */}
          <div className="mt-6">
            <MarketingButton
              type="button"
              size="xl"
              className="w-full"
              disabled={codeString.length !== 6 || isVerifying}
              onClick={handleVerify}
            >
              {isVerifying ? "Verifying..." : "Verify Email"}
            </MarketingButton>
          </div>

          {/* Resend */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#4A4A4A]">
              Didn&apos;t receive the code?
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="mt-1 text-sm font-medium text-[#7C3AED] hover:underline disabled:opacity-50"
            >
              {isResending ? "Sending..." : "Resend Code"}
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-[#4A4A4A]">
            The code expires in 15 minutes. Check your spam folder if you
            don&apos;t see the email.
          </p>
        </div>
      </div>
    </div>
  );
}
