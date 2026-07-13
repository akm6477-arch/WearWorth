import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  isDatabaseUnavailableError,
  prisma,
} from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";

export const AUTH_COOKIE_NAME = "wearworth_token";

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

function buildFallbackUser(
  payload: NonNullable<ReturnType<typeof verifyAuthToken>>,
) {
  const emailName = payload.email.split("@")[0] || "Member";
  const formattedName = emailName
    .split(/[._-]+/)
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(" ");

  return {
    id: payload.userId,
    name: formattedName || "WearWorth Member",
    email: payload.email,
    role: payload.role,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };
}

export async function getCurrentUserFromRequest(
  request?: NextRequest | Request,
) {
  const cookieStore =
    request && "cookies" in request
      ? request.cookies
      : await cookies();

  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = verifyAuthToken(token);

  if (!payload) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user ?? null;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return buildFallbackUser(payload);
    }

    throw error;
  }
}

export async function requireAuthUser(
  request: NextRequest | Request,
) {
  const user = await getCurrentUserFromRequest(request);

  if (!user) {
    return {
      user: null,
      response: clearAuthCookie(
        NextResponse.json(
          {
            error: "Please sign in to continue.",
          },
          {
            status: 401,
          },
        ),
      ),
    };
  }

  return {
    user,
    response: null,
  };
}

export async function requireAdminUser(
  request: NextRequest | Request,
) {
  const authResult = await requireAuthUser(request);

  if (!authResult.user) {
    return authResult;
  }

  if (authResult.user.role !== "ADMIN") {
    return {
      user: null,
      response: NextResponse.json(
        {
          error: "You are not authorized to access this area.",
        },
        {
          status: 403,
        },
      ),
    };
  }

  return authResult;
}
