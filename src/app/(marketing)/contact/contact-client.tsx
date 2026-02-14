"use client";

import * as React from "react";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { FadeIn } from "@/components/marketing/fade-in";
import {
  Clock,
  Shield,
  Headphones,
  MessageSquare,
  CheckCircle,
} from "lucide-react";

export function ContactClient() {
  const [formState, setFormState] = React.useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = React.useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState("submitting");
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit form");
      }

      setFormState("success");
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      setFormState("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  };

  const inputStyles =
    "w-full rounded-xl border-2 border-[#E5E5E5] bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-[#A0A0A0] focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 disabled:opacity-50";

  return (
    <div className="px-6 py-32">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <FadeIn>
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-3xl text-[#1A1A1A] md:text-4xl">
              Get in Touch
            </h1>
            <p className="mt-4 text-lg text-[#4A4A4A]">
              Have a question about No Context Bot? Need help with your account?
              Want to share feedback or report a bug? We&apos;d love to hear
              from you.
            </p>
          </div>
        </FadeIn>

        {/* Info Cards */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Clock,
              title: "Fast Response",
              description:
                "We typically respond within 24 hours during business days. Urgent issues are prioritized.",
            },
            {
              icon: Headphones,
              title: "Dedicated Support",
              description:
                "Our team is dedicated to helping you get the most out of No Context Bot. No question is too small.",
            },
            {
              icon: Shield,
              title: "Privacy First",
              description:
                "Your information is safe with us. We only use your contact details to respond to your inquiry.",
            },
          ].map((card) => (
            <FadeIn key={card.title} className="h-full">
              <div className="h-full rounded-xl border-2 border-[#1A1A1A] bg-white p-6 text-center shadow-[3px_3px_0px_0px_#1A1A1A]">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EDE9FE]">
                  <card.icon className="h-6 w-6 text-[#7C3AED]" />
                </div>
                <h3 className="font-semibold text-[#1A1A1A]">{card.title}</h3>
                <p className="mt-2 text-sm text-[#4A4A4A]">
                  {card.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Main Content */}
        <div className="mt-16 grid gap-12 lg:grid-cols-2">
          {/* Left Column - Info */}
          <div className="space-y-8">
            <FadeIn>
              <div>
                <h2 className="font-display text-2xl text-[#1A1A1A]">
                  How Can We Help?
                </h2>
                <p className="mt-4 text-[#4A4A4A]">
                  Whether you&apos;re having trouble with the bot, need help
                  with settings, have a feature suggestion, or just want to say
                  hello — fill out the form and we&apos;ll get back to you as
                  soon as possible.
                </p>
              </div>
            </FadeIn>

            <FadeIn>
              <div className="space-y-4">
                <div className="rounded-xl border-2 border-[#1A1A1A] bg-white p-6 shadow-[3px_3px_0px_0px_#1A1A1A]">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EDE9FE]">
                      <MessageSquare className="h-6 w-6 text-[#7C3AED]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1A1A1A]">
                        What to Include
                      </h3>
                      <p className="mt-1 text-sm text-[#4A4A4A]">
                        For the fastest resolution, please include your
                        workspace name, the channel you&apos;re using, and any
                        error messages you&apos;ve seen.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>

            <FadeIn>
              <div>
                <h3 className="text-lg font-semibold text-[#1A1A1A]">
                  Common Topics We Help With
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-[#4A4A4A]">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-[#7C3AED]">&bull;</span>
                    <span>
                      <strong>Account Issues:</strong> Login problems,
                      subscription questions, or workspace settings.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-[#7C3AED]">&bull;</span>
                    <span>
                      <strong>Bot Setup:</strong> Trouble connecting channels,
                      configuring styles, or getting the bot running.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-[#7C3AED]">&bull;</span>
                    <span>
                      <strong>Feature Requests:</strong> Have an idea to make No
                      Context even better? We love hearing suggestions!
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-[#7C3AED]">&bull;</span>
                    <span>
                      <strong>Bug Reports:</strong> Found something not working
                      right? Please include steps to reproduce the issue.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-[#7C3AED]">&bull;</span>
                    <span>
                      <strong>General Feedback:</strong> Tell us what you love,
                      what could be improved, or share your team&apos;s best
                      quotes!
                    </span>
                  </li>
                </ul>
              </div>
            </FadeIn>
          </div>

          {/* Right Column - Form */}
          <FadeIn>
            <div className="rounded-xl border-2 border-[#1A1A1A] bg-white p-8 shadow-[4px_4px_0px_0px_#1A1A1A]">
              {formState === "success" ? (
                <div className="space-y-4 py-12 text-center">
                  <div className="flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EDE9FE]">
                      <CheckCircle className="h-10 w-10 text-[#7C3AED]" />
                    </div>
                  </div>
                  <h3 className="font-display text-2xl text-[#1A1A1A]">
                    Message Sent!
                  </h3>
                  <p className="text-[#4A4A4A]">
                    Thank you for contacting us. We&apos;ll review your message
                    and get back to you within 24 hours.
                  </p>
                  <MarketingButton
                    variant="secondary"
                    onClick={() => setFormState("idle")}
                    className="mt-4"
                  >
                    Send Another Message
                  </MarketingButton>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-medium text-[#1A1A1A]"
                    >
                      Name *
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      disabled={formState === "submitting"}
                      placeholder="Your name"
                      className={inputStyles}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium text-[#1A1A1A]"
                    >
                      Email *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      disabled={formState === "submitting"}
                      placeholder="your.email@example.com"
                      className={inputStyles}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="mb-2 block text-sm font-medium text-[#1A1A1A]"
                    >
                      Subject
                    </label>
                    <input
                      id="subject"
                      name="subject"
                      type="text"
                      disabled={formState === "submitting"}
                      placeholder="How can we help?"
                      className={inputStyles}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="mb-2 block text-sm font-medium text-[#1A1A1A]"
                    >
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      disabled={formState === "submitting"}
                      placeholder="Tell us more about your question or feedback..."
                      rows={6}
                      className={inputStyles + " resize-y"}
                    />
                  </div>

                  {formState === "error" && (
                    <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 text-sm text-red-700">
                      {errorMessage}
                    </div>
                  )}

                  <MarketingButton
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={formState === "submitting"}
                  >
                    {formState === "submitting" ? "Sending..." : "Send Message"}
                  </MarketingButton>
                </form>
              )}
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
