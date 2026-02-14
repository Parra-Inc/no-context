import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, email, subject, message } = body;

    if (!name || typeof name !== "string" || name.length > 100) {
      return NextResponse.json(
        { error: "Name is required and must be under 100 characters" },
        { status: 400 },
      );
    }

    if (
      !email ||
      typeof email !== "string" ||
      !email.includes("@") ||
      email.length > 255
    ) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 },
      );
    }

    if (
      !message ||
      typeof message !== "string" ||
      message.length < 10 ||
      message.length > 5000
    ) {
      return NextResponse.json(
        { error: "Message must be between 10 and 5000 characters" },
        { status: 400 },
      );
    }

    if (subject && (typeof subject !== "string" || subject.length > 200)) {
      return NextResponse.json(
        { error: "Subject must be under 200 characters" },
        { status: 400 },
      );
    }

    const submission = await prisma.contactFormSubmission.create({
      data: {
        name,
        email,
        subject: subject || null,
        message,
        status: "new",
      },
    });

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
