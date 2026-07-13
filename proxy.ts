import { NextRequest, NextResponse } from "next/server";

import { verifyAuthToken } from "@/lib/jwt";
import { sanitizeRedirectPath } from "@/lib/routes";

const AUTH_COOKIE_NAME = "wearworth_token";

const protectedRoutes = [
  "/profile",
  "/checkout",
  "/orders",
  "/addresses",
  "/admin",
];

function clearAuthCookie(response: NextResponse) {
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

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  const redirectPath = sanitizeRedirectPath(
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
    "/profile",
  );

  loginUrl.searchParams.set("redirect", redirectPath);

  return clearAuthCookie(NextResponse.redirect(loginUrl));
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requiresAuth = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (!requiresAuth) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return redirectToLogin(request);
  }

  const payload = verifyAuthToken(token);

  if (!payload) {
    return redirectToLogin(request);
  }

  if (pathname.startsWith("/admin") && payload.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/addresses/:path*",
    "/admin/:path*",
  ],
};
