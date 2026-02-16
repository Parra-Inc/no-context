"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { motion } from "motion/react";
import { CheckCircle2, MessageSquare, ArrowLeft } from "lucide-react";

interface SuccessContentProps {
  workspaceName: string;
  workspaceIcon: string | null;
  bonusCredits: number;
  monthlyQuota: number;
}

function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) return;
    const duration = 1500;
    const steps = 30;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      // Ease-out curve
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [target]);

  return <span className="tabular-nums">{count}</span>;
}

export function SuccessContent({
  workspaceName,
  workspaceIcon,
  bonusCredits,
  monthlyQuota,
}: SuccessContentProps) {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="mx-auto max-w-lg px-4 py-12">
        {/* Logo */}
        <div className="mb-10 flex justify-center">
          <Logo size="lg" />
        </div>

        {/* Workspace identity */}
        <div className="mb-8 flex flex-col items-center gap-3">
          {workspaceIcon && (
            <Image
              src={workspaceIcon}
              alt={workspaceName}
              width={48}
              height={48}
              className="rounded-lg border-2 border-[#1A1A1A]"
            />
          )}
          <p className="text-sm font-medium text-[#4A4A4A]">{workspaceName}</p>
        </div>

        {/* Success card */}
        <div className="mb-6 rounded-xl border-2 border-[#1A1A1A] bg-white p-8 text-center shadow-[3px_3px_0px_0px_#1A1A1A]">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.2,
            }}
            className="mb-4 inline-flex"
          >
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6 text-2xl font-bold text-[#1A1A1A]"
          >
            Purchase complete!
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="mb-2 text-6xl font-bold text-[#7C3AED]">
              <AnimatedCounter target={bonusCredits} />
            </div>
            <p className="text-sm text-[#4A4A4A]">
              bonus image generations available
            </p>
            <p className="mt-1 text-xs text-[#4A4A4A]/60">
              + {monthlyQuota} monthly quota
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-4 text-[11px] text-[#4A4A4A]/50"
          >
            Your credits may take a moment to appear if you just completed
            checkout.
          </motion.p>
        </div>

        {/* Go back to Slack */}
        <div className="mb-6 flex justify-center">
          <a
            href="https://slack.com/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-[#1A1A1A] bg-[#7C3AED] px-8 text-sm font-bold text-white shadow-[4px_4px_0px_0px_#1A1A1A] transition-all duration-150 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1A1A1A] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back to Slack
          </a>
        </div>

        {/* Info card: regenerating images */}
        <div className="rounded-xl border-2 border-[#1A1A1A] bg-white p-6 shadow-[3px_3px_0px_0px_#1A1A1A]">
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#7C3AED]" />
            <h2 className="text-sm font-bold text-[#1A1A1A]">
              Want to generate an image for a quote that already happened?
            </h2>
          </div>
          <p className="text-sm text-[#4A4A4A]">
            You can mention{" "}
            <span className="rounded bg-[#7C3AED]/10 px-1.5 py-0.5 font-mono text-xs text-[#7C3AED]">
              @No Context
            </span>{" "}
            in a thread reply to any message in a connected channel, and the bot
            will generate an image for that quote.
          </p>
          <p className="mt-3 text-sm text-[#4A4A4A]">
            You can also use{" "}
            <span className="rounded bg-[#7C3AED]/10 px-1.5 py-0.5 font-mono text-xs text-[#7C3AED]">
              /nocontext status
            </span>{" "}
            to check your current usage and remaining credits at any time.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-center gap-4 text-xs text-[#4A4A4A]/60">
          <Link href="/privacy" className="hover:text-[#4A4A4A]">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-[#4A4A4A]">
            Terms
          </Link>
        </div>
      </div>
    </div>
  );
}
