import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import { createAuthToken } from "@/lib/jwt";
import { rateLimit } from "@/lib/rate-limit";

interface RegisterRequestBody {
  name?: unknown;
  email?: unknown;
  password?: unknown;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
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
    key: "auth-register",
    limit: 5,
    windowMs: 5 * 60 * 1000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  try {
    const body = (await request.json()) as RegisterRequestBody;

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? normalizeEmail(body.email)
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (name.length < 2) {
      return NextResponse.json(
        {
          error: "Please enter your full name.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email,
      )
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

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "An account with this email already exists.",
        },
        {
          status: 409,
        },
      );
    }

    const hashedPassword =
      await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const token = createAuthToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        message:
          "Your WearWorth account has been created.",
        user,
      },
      {
        status: 201,
      },
    );

    response.cookies.set({
      name: "wearworth_token",
      value: token,
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error(
      "REGISTER_API_ERROR",
      error,
    );

    return NextResponse.json(
      {
        error:
          "We could not create your account right now.",
      },
      {
        status: 500,
      },
    );
  }
}
