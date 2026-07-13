import crypto from "node:crypto";
import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/hash";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

interface ResetPasswordBody {
  token?: unknown;
  password?: unknown;
}

function validatePassword(password: string) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  );
}

export async function POST(request: Request) {
  const rateLimited = rateLimit(request, {
    key: "auth-reset-password",
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  try {
    const body = (await request.json()) as ResetPasswordBody;
    const token =
      typeof body.token === "string"
        ? body.token.trim()
        : "";
    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!token || !password) {
      return NextResponse.json(
        {
          error: "Reset token and new password are required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!validatePassword(password)) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters and include uppercase, lowercase and a number.",
        },
        {
          status: 400,
        },
      );
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!resetToken?.userId) {
      return NextResponse.json(
        {
          error: "This reset link is invalid or expired.",
        },
        {
          status: 400,
        },
      );
    }

    const passwordHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: resetToken.userId,
        },
        data: {
          password: passwordHash,
        },
      }),
      prisma.passwordResetToken.update({
        where: {
          id: resetToken.id,
        },
        data: {
          usedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      message: "Password reset successfully.",
    });
  } catch (error) {
    console.error("RESET_PASSWORD_API_ERROR", error);

    return NextResponse.json(
      {
        error: "Unable to reset the password right now.",
      },
      {
        status: 500,
      },
    );
  }
}
