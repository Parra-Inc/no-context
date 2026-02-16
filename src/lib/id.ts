import { randomBytes } from "crypto";

const MODEL_PREFIXES: Record<string, string> = {
  Workspace: "ws",
  Subscription: "sub",
  Channel: "ch",
  Quote: "qt",
  Style: "sty",
  ChannelStyle: "chs",
  ImageGeneration: "ig",
  UsageRecord: "ur",
  TokenPurchase: "tp",
  ContactFormSubmission: "cfs",
  User: "usr",
  SlackEvent: "se",
  EmailVerificationCode: "evc",
};

export function createId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString("base64url")}`;
}

export function generateCheckoutToken(): string {
  return randomBytes(24).toString("base64url");
}

export function getModelPrefix(model: string): string | undefined {
  return MODEL_PREFIXES[model];
}
