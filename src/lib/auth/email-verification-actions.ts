"use server";

import {
  verifyCode as verifyCodeUtil,
  cleanupExpiredCodes,
} from "./email-verification";
import { sendVerificationEmail } from "@/lib/email/send-verification";

export async function verifyCodeAction(userId: string, code: string) {
  try {
    if (code.length !== 6) {
      return { success: false, error: "Code must be 6 digits" };
    }

    const result = await verifyCodeUtil(userId, code);

    if (!result) {
      return { success: false, error: "Invalid or expired verification code" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error verifying code:", error);
    return { success: false, error: "Failed to verify code" };
  }
}

export async function sendVerificationEmailAction(userId: string) {
  try {
    await cleanupExpiredCodes();
    const result = await sendVerificationEmail(userId);
    return result;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return { success: false, error: "Failed to send verification email" };
  }
}
