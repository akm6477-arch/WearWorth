import { NextRequest, NextResponse } from "next/server";

import { requireAuthUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/hash";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

interface ChangePasswordBody {
  currentPassword?: unknown;
  newPassword?: unknown;
}

function validatePassword(password: string) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  );
}

export async function POST(request: NextRequest) {
  const rateLimited = rateLimit(request, {
    key: "auth-change-password",
    limit: 5,
    windowMs: 5 * 60 * 1000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  const authResult = await requireAuthUser(request);

  if (!authResult.user) {
    return authResult.response;
  }

  try {
    const body = (await request.json()) as ChangePasswordBody;
    const currentPassword =
      typeof body.currentPassword === "string"
        ? body.currentPassword
        : "";
    const newPassword =
      typeof body.newPassword === "string"
        ? body.newPassword
        : "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          error: "Current and new password are required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!validatePassword(newPassword)) {
      return NextResponse.json(
        {
          error:
            "New password must be at least 8 characters and include uppercase, lowercase and a number.",
        },
        {
          status: 400,
        },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: authResult.user.id,
      },
      select: {
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Account not found.",
        },
        {
          status: 404,
        },
      );
    }

    const passwordMatches = await verifyPassword(
      currentPassword,
      user.password,
    );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          error: "Current password is incorrect.",
        },
        {
          status: 401,
        },
      );
    }

    const nextPasswordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: {
        id: authResult.user.id,
      },
      data: {
        password: nextPasswordHash,
      },
    });

    return NextResponse.json({
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("CHANGE_PASSWORD_API_ERROR", error);

    return NextResponse.json(
      {
        error: "Unable to update password right now.",
      },
      {
        status: 500,
      },
    );
  }
}
