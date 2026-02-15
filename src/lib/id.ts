import { randomBytes } from "crypto";

const MODEL_PREFIXES: Record<string, string> = {
  Workspace: "ws",
  Subscription: "sub",
  Channel: "ch",
  Quote: "qt",
  CustomStyle: "cs",
  UsageRecord: "ur",
  ContactFormSubmission: "cfs",
  User: "usr",
  EmailVerificationCode: "evc",
};

export function createId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString("base64url")}`;
}

export function getModelPrefix(model: string): string | undefined {
  return MODEL_PREFIXES[model];
}
