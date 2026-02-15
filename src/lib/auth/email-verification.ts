"use server";

import prisma from "@/lib/prisma";
import { randomInt, randomBytes } from "crypto";

const VERIFICATION_CODE_EXPIRY_MINUTES = 15;

export async function generateVerificationCode(
  userId: string,
): Promise<{ code: string; token: string }> {
  const code = randomInt(100000, 999999).toString();
  const token = randomBytes(32).toString("base64url");

  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + VERIFICATION_CODE_EXPIRY_MINUTES);

  await prisma.emailVerificationCode.create({
    data: {
      userId,
      code,
      token,
      expires,
    },
  });

  return { code, token };
}

export async function verifyCode(
  userId: string,
  code: string,
): Promise<{ success: boolean } | null> {
  const verificationCode = await prisma.emailVerificationCode.findFirst({
    where: {
      userId,
      code,
      used: false,
      expires: { gt: new Date() },
    },
  });

  if (!verificationCode) {
    return null;
  }

  await prisma.emailVerificationCode.update({
    where: { id: verificationCode.id },
    data: { used: true },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() },
  });

  return { success: true };
}

export async function verifyToken(
  token: string,
): Promise<{ success: boolean; userId?: string }> {
  const verificationCode = await prisma.emailVerificationCode.findUnique({
    where: { token },
  });

  if (
    !verificationCode ||
    verificationCode.used ||
    verificationCode.expires < new Date()
  ) {
    return { success: false };
  }

  await prisma.emailVerificationCode.update({
    where: { id: verificationCode.id },
    data: { used: true },
  });

  await prisma.user.update({
    where: { id: verificationCode.userId },
    data: { emailVerified: new Date() },
  });

  return { success: true, userId: verificationCode.userId };
}

export async function cleanupExpiredCodes(): Promise<void> {
  await prisma.emailVerificationCode.deleteMany({
    where: {
      OR: [{ expires: { lt: new Date() } }, { used: true }],
    },
  });
}
