import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/hash";
import { createAuthToken } from "@/lib/jwt";
import { rateLimit } from "@/lib/rate-limit";

interface LoginRequestBody {
  email?: unknown;
  password?: unknown;
  rememberMe?: unknown;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(request: Request) {
  const rateLimited = rateLimit(request, {
    key: "auth-login",
    limit: 10,
    windowMs: 60 * 1000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  try {
    const body = (await request.json()) as LoginRequestBody;

    const email =
      typeof body.email === "string"
        ? normalizeEmail(body.email)
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    const rememberMe = body.rememberMe === true;

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

    if (!password) {
      return NextResponse.json(
        {
          error: "Please enter your password.",
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
        name: true,
        email: true,
        password: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Email or password is incorrect.",
        },
        {
          status: 401,
        },
      );
    }

    const passwordMatches = await verifyPassword(
      password,
      user.password,
    );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          error: "Email or password is incorrect.",
        },
        {
          status: 401,
        },
      );
    }

    const token = createAuthToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        message: "You are now signed in.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
      {
        status: 200,
      },
    );

    response.cookies.set({
      name: "wearworth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: rememberMe
        ? 60 * 60 * 24 * 30
        : 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("LOGIN_API_ERROR", error);

    return NextResponse.json(
      {
        error:
          "We could not sign you in right now. Please try again.",
      },
      {
        status: 500,
      },
    );
  }
}
