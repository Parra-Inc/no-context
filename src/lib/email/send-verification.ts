"use server";

import { render } from "@react-email/render";
import { VerificationEmail } from "@/emails/verification-email";
import { generateVerificationCode } from "@/lib/auth/email-verification";
import prisma from "@/lib/prisma";
import { sendEmail } from "./email-service";

export async function sendVerificationEmail(
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user?.email) {
      return { success: false, error: "User not found" };
    }

    const { code, token } = await generateVerificationCode(userId);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verificationUrl = `${baseUrl}/auth/verify-email/code/${token}`;

    const emailHtml = await render(
      VerificationEmail({
        verificationCode: code,
        userName: user.name || undefined,
        verificationUrl,
      }),
    );

    const result = await sendEmail({
      to: user.email,
      subject: "Verify your email address - No Context",
      html: emailHtml,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to send verification email",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending verification email:", error);
    return { success: false, error: "Failed to send verification email" };
  }
}
