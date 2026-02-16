import prisma from "@/lib/prisma";
import { after, NextResponse } from "next/server";
import { z } from "zod/v4";
import { notifyContactFormSubmission } from "@/lib/slack-notifications";

const ContactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  message: z.string().min(10).max(5000),
  subject: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = ContactSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const { name, email, message, subject } = result.data;

    const submission = await prisma.contactFormSubmission.create({
      data: {
        name,
        email,
        subject: subject || null,
        message,
        status: "new",
      },
    });

    after(() =>
      notifyContactFormSubmission({
        submissionId: submission.id,
        name,
        email,
        subject,
        message,
      }),
    );

    return NextResponse.json(
      { success: true, id: submission.id },
      { status: 201 },
    );
  } catch (error) {
    console.error("Contact form submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit contact form" },
      { status: 500 },
    );
  }
}
