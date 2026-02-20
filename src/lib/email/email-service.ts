"use server";

import { Resend } from "resend";
import nodemailer from "nodemailer";
import { NOREPLY_EMAIL } from "@/lib/constants";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

let resendClient: Resend | undefined = undefined;
let mailhogTransporter: nodemailer.Transporter | undefined = undefined;
const isDevelopment = process.env.NODE_ENV === "development";

function initializeClients() {
  if (!isDevelopment && !resendClient) {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error(
        "RESEND_API_KEY environment variable is required for production",
      );
    }
    resendClient = new Resend(resendApiKey);
  }
  if (isDevelopment && !mailhogTransporter) {
    mailhogTransporter = nodemailer.createTransport({
      host: process.env.MAILHOG_HOST || "localhost",
      port: parseInt(process.env.MAILHOG_PORT || "1025"),
      secure: false,
    });
  }
}

async function sendViaMailHog(
  options: EmailOptions,
): Promise<{ success: boolean; error?: string }> {
  try {
    initializeClients();
    if (!mailhogTransporter) {
      throw new Error("MailHog transporter not initialized");
    }

    await mailhogTransporter.sendMail({
      from: options.from || NOREPLY_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log("Email sent via MailHog:");
    console.log(`  To: ${options.to}`);
    console.log(`  Subject: ${options.subject}`);
    console.log("  Check MailHog UI at http://localhost:8026");

    return { success: true };
  } catch (error) {
    console.error("MailHog send error:", error);
    return { success: false, error: "Failed to send email via MailHog" };
  }
}

async function sendViaResend(
  options: EmailOptions,
): Promise<{ success: boolean; error?: string }> {
  try {
    initializeClients();
    if (!resendClient) {
      throw new Error("Resend client not initialized");
    }

    const fromEmail =
      options.from || process.env.RESEND_FROM_EMAIL || NOREPLY_EMAIL;

    const result = await resendClient.emails.send({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return {
        success: false,
        error: result.error.message || "Failed to send email via Resend",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Resend send error:", error);
    return { success: false, error: "Failed to send email via Resend" };
  }
}

export async function sendEmail(
  options: EmailOptions,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (isDevelopment) {
      return await sendViaMailHog(options);
    } else {
      return await sendViaResend(options);
    }
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: "Failed to send email" };
  }
}
