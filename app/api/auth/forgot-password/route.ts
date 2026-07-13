import crypto from "node:crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

interface ForgotPasswordBody {
  email?: unknown;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(request: Request) {
  const rateLimited = rateLimit(request, {
    key: "auth-forgot-password",
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  try {
    const body = (await request.json()) as ForgotPasswordBody;
    const email =
      typeof body.email === "string"
        ? normalizeEmail(body.email)
        : "";

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        {
          error: "Please enter a valid email address.",
        },
        {
          status: 400,
        },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          email: user.email,
          tokenHash,
          expiresAt: new Date(
            Date.now() + 1000 * 60 * 30,
          ),
        },
      });
    }

    return NextResponse.json({
      message:
        "Email delivery is not configured yet. Please contact WearWorth support for assistance.",
    });
  } catch (error) {
    console.error("FORGOT_PASSWORD_API_ERROR", error);

    return NextResponse.json(
      {
        error: "Unable to start the password reset flow.",
      },
      {
        status: 500,
      },
    );
  }
}
