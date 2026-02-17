"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { Input } from "@/components/ui/input";
import { signIn as nextAuthSignIn } from "next-auth/react";
import { signInWithSlack, signInWithEmail } from "./actions";

const GALLERY_CARDS = [
  {
    src: "/images/landing/gallery/duck-ghibli.png",
    style: "Ghibli",
    quote: "\u201CThis duck has seen things you wouldn\u2019t believe\u201D",
    author: "Raj, Engineering",
  },
  {
    src: "/images/landing/gallery/goat-cubism.png",
    style: "Cubism",
    quote: "\u201CThat\u2019s not a bug, that\u2019s a goat\u201D",
    author: "Priya, Product",
  },
  {
    src: "/images/landing/gallery/seagull-hokusai.png",
    style: "Ukiyo-e",
    quote: "\u201CWho let the seagull into standup again\u201D",
    author: "Sam, Design",
  },
  {
    src: "/images/landing/gallery/throne-vangogh.png",
    style: "Van Gogh",
    quote: "\u201CThe intern sits on the throne now\u201D",
    author: "Mike, Engineering",
  },
  {
    src: "/images/landing/gallery/plants-watercolor.png",
    style: "Watercolor",
    quote: "\u201CThe office plants are thriving more than our roadmap\u201D",
    author: "Tina, Marketing",
  },
  {
    src: "/images/landing/gallery/raccoon-pixel.png",
    style: "Pixel Art",
    quote: "\u201CThere\u2019s a raccoon in the server room again\u201D",
    author: "Alex, Ops",
  },
];

type AuthTab = "signin" | "signup";

export function SignInContent() {
  const [tab, setTab] = useState<AuthTab>("signin");
  const [slackError, slackFormAction, isSlackPending] = useActionState(
    signInWithSlack,
    null,
  );
  const [emailError, emailFormAction, isEmailPending] = useActionState(
    signInWithEmail,
    null,
  );
  const [signupError, setSignupError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSignupError(null);
    setIsSigningUp(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    if (!email || !password) {
      setSignupError("Email and password are required.");
      setIsSigningUp(false);
      return;
    }

    if (password.length < 8) {
      setSignupError("Password must be at least 8 characters.");
      setIsSigningUp(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSignupError(data.error || "Something went wrong.");
        setIsSigningUp(false);
        return;
      }

      // Auto sign-in the newly created user
      const signInResult = await nextAuthSignIn("email", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.ok) {
        router.push("/auth/verify-email");
      } else {
        // Fallback: redirect with params if auto sign-in fails
        router.push(
          `/auth/verify-email?userId=${data.userId}&email=${encodeURIComponent(email)}`,
        );
      }
    } catch {
      setSignupError("Something went wrong. Please try again.");
      setIsSigningUp(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Mobile gallery — peeking strip above sign-in */}
      <div className="relative h-[28rem] w-full overflow-hidden bg-[#F5F0FF] lg:hidden">
        <div className="absolute -inset-10 -rotate-3">
          <div className="grid grid-cols-2 gap-3 p-3">
            {GALLERY_CARDS.map((card, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-md border-2 border-[#1A1A1A] bg-white shadow-[4px_4px_0px_0px_#1A1A1A]"
              >
                <div className="relative aspect-[4/3] border-b-2 border-[#1A1A1A]">
                  <Image
                    src={card.src}
                    alt={card.style}
                    fill
                    className="object-cover"
                    sizes="300px"
                  />
                </div>
                <div className="px-3 py-2">
                  <p className="text-xs leading-snug font-bold text-[#1A1A1A]">
                    {card.quote}
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-[#4A4A4A]">
                      — {card.author}
                    </span>
                    <span className="rounded-sm border border-[#7C3AED] bg-[#EDE9FE] px-1.5 py-0.5 text-[8px] font-bold text-[#7C3AED]">
                      {card.style}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Comic-style angled clip — mobile */}
        <svg
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 block h-8 w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <polygon points="100,0 100,100 0,100" fill="var(--background)" />
          <line
            x1="0"
            y1="100"
            x2="100"
            y2="0"
            stroke="#1A1A1A"
            strokeWidth="6"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      {/* Sign in */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-12 lg:w-[45%] lg:py-0">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <Link href="/">
              <Logo size="lg" className="mx-auto" />
            </Link>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex rounded-xl border-2 border-[#1A1A1A] bg-white shadow-[3px_3px_0px_0px_#1A1A1A]">
            <button
              type="button"
              onClick={() => setTab("signin")}
              className={`flex-1 rounded-l-[10px] px-4 py-2.5 text-sm font-bold transition-colors ${
                tab === "signin"
                  ? "bg-[#7C3AED] text-white"
                  : "text-[#4A4A4A] hover:bg-[#F5F0FF]"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setTab("signup")}
              className={`flex-1 rounded-r-[10px] px-4 py-2.5 text-sm font-bold transition-colors ${
                tab === "signup"
                  ? "bg-[#7C3AED] text-white"
                  : "text-[#4A4A4A] hover:bg-[#F5F0FF]"
              }`}
            >
              Sign Up
            </button>
          </div>

          {tab === "signin" ? (
            <>
              {/* Slack sign in */}
              <form action={slackFormAction}>
                <MarketingButton
                  type="submit"
                  variant="secondary"
                  size="xl"
                  className="w-full gap-3"
                  disabled={isSlackPending}
                >
                  <SlackIcon />
                  {isSlackPending ? "Redirecting..." : "Sign in with Slack"}
                </MarketingButton>
              </form>

              {slackError && (
                <p className="mt-4 text-center text-sm text-red-600">
                  {slackError}
                </p>
              )}

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-[#e5e5e5]" />
                <span className="text-xs font-medium text-[#4A4A4A]">or</span>
                <div className="h-px flex-1 bg-[#e5e5e5]" />
              </div>

              {/* Email sign in */}
              <form action={emailFormAction} className="space-y-4">
                <div>
                  <label
                    htmlFor="signin-email"
                    className="mb-1.5 block text-sm font-medium text-[#1A1A1A]"
                  >
                    Email
                  </label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="you@company.com"
                    required
                    className="h-11 rounded-xl border-2 border-[#1A1A1A]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="signin-password"
                    className="mb-1.5 block text-sm font-medium text-[#1A1A1A]"
                  >
                    Password
                  </label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                    className="h-11 rounded-xl border-2 border-[#1A1A1A]"
                  />
                </div>
                <MarketingButton
                  type="submit"
                  size="xl"
                  className="w-full"
                  disabled={isEmailPending}
                >
                  {isEmailPending ? "Signing in..." : "Sign in with Email"}
                </MarketingButton>
              </form>

              {emailError && (
                <p className="mt-4 text-center text-sm text-red-600">
                  {emailError}
                </p>
              )}
            </>
          ) : (
            <>
              {/* Sign up form */}
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label
                    htmlFor="signup-name"
                    className="mb-1.5 block text-sm font-medium text-[#1A1A1A]"
                  >
                    Name{" "}
                    <span className="font-normal text-[#4A4A4A]">
                      (optional)
                    </span>
                  </label>
                  <Input
                    id="signup-name"
                    name="name"
                    type="text"
                    placeholder="Your name"
                    className="h-11 rounded-xl border-2 border-[#1A1A1A]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="signup-email"
                    className="mb-1.5 block text-sm font-medium text-[#1A1A1A]"
                  >
                    Email
                  </label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="you@company.com"
                    required
                    className="h-11 rounded-xl border-2 border-[#1A1A1A]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="signup-password"
                    className="mb-1.5 block text-sm font-medium text-[#1A1A1A]"
                  >
                    Password
                  </label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    className="h-11 rounded-xl border-2 border-[#1A1A1A]"
                  />
                </div>
                <MarketingButton
                  type="submit"
                  size="xl"
                  className="w-full"
                  disabled={isSigningUp}
                >
                  {isSigningUp ? "Creating account..." : "Create Account"}
                </MarketingButton>
              </form>

              {signupError && (
                <p className="mt-4 text-center text-sm text-red-600">
                  {signupError}
                </p>
              )}
            </>
          )}
        </div>

        <p className="mt-8 text-xs text-[#4A4A4A]/60 lg:absolute lg:bottom-6 lg:mt-0">
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>
          {" \u00B7 "}
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>
        </p>
      </div>

      {/* Desktop gallery — right side */}
      <div className="relative hidden w-[55%] overflow-hidden bg-[#F5F0FF] lg:block">
        <div className="absolute -inset-20 -rotate-6">
          <div className="grid grid-cols-2 gap-3 p-3">
            {GALLERY_CARDS.map((card, i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-md border-2 border-[#1A1A1A] bg-white shadow-[4px_4px_0px_0px_#1A1A1A]"
              >
                <div className="relative aspect-[4/3] border-b-2 border-[#1A1A1A]">
                  <Image
                    src={card.src}
                    alt={card.style}
                    fill
                    className="object-cover"
                    sizes="400px"
                  />
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm leading-snug font-bold text-[#1A1A1A]">
                    {card.quote}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-xs font-medium text-[#4A4A4A]">
                      — {card.author}
                    </span>
                    <span className="rounded-sm border border-[#7C3AED] bg-[#EDE9FE] px-2 py-0.5 text-[10px] font-bold text-[#7C3AED]">
                      {card.style}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Comic-style angled clip — desktop */}
        <svg
          className="pointer-events-none absolute inset-y-0 left-0 z-10 h-full w-8"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <polygon points="0,0 100,0 0,100" fill="var(--background)" />
          <line
            x1="100"
            y1="0"
            x2="0"
            y2="100"
            stroke="#1A1A1A"
            strokeWidth="6"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
}

function SlackIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 2447.6 2452.5"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipRule="evenodd" fillRule="evenodd">
        <path
          d="m897.4 0c-135.3.1-244.8 109.9-244.7 245.2-.1 135.3 109.5 245.1 244.8 245.2h244.8v-245.1c.1-135.3-109.5-245.1-244.9-245.3.1 0 .1 0 0 0m0 654h-652.6c-135.3.1-244.9 109.9-244.8 245.2-.2 135.3 109.4 245.1 244.7 245.3h652.7c135.3-.1 244.9-109.9 244.8-245.2.1-135.4-109.5-245.2-244.8-245.3z"
          fill="#36c5f0"
        />
        <path
          d="m2447.6 899.2c.1-135.3-109.5-245.1-244.8-245.2-135.3.1-244.9 109.9-244.8 245.2v245.3h244.8c135.3-.1 244.9-109.9 244.8-245.3zm-652.7 0v-654c.1-135.2-109.4-245-244.7-245.2-135.3.1-244.9 109.9-244.8 245.2v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.3z"
          fill="#2eb67d"
        />
        <path
          d="m1550.1 2452.5c135.3-.1 244.9-109.9 244.8-245.2.1-135.3-109.5-245.1-244.8-245.2h-244.8v245.2c-.1 135.2 109.5 245 244.8 245.2zm0-654.1h652.7c135.3-.1 244.9-109.9 244.8-245.2.2-135.3-109.4-245.1-244.7-245.3h-652.7c-135.3.1-244.9 109.9-244.8 245.2-.1 135.4 109.4 245.2 244.7 245.3z"
          fill="#ecb22e"
        />
        <path
          d="m0 1553.2c-.1 135.3 109.5 245.1 244.8 245.2 135.3-.1 244.9-109.9 244.8-245.2v-245.2h-244.8c-135.3.1-244.9 109.9-244.8 245.2zm652.7 0v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.2v-653.9c.2-135.3-109.4-245.1-244.7-245.3-135.4 0-244.9 109.8-244.8 245.1 0 0 0 .1 0 0"
          fill="#e01e5a"
        />
      </g>
    </svg>
  );
}
