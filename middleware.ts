import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = [
  "/profile",
  "/checkout",
  "/orders",
  "/addresses",
  "/admin",
];

export function middleware(request: NextRequest) {
  const token =
    request.cookies.get("wearworth_token")?.value;

  const pathname = request.nextUrl.pathname;

  const requiresAuth = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (requiresAuth && !token) {
    const loginUrl = new URL(
      "/login",
      request.url,
    );

    loginUrl.searchParams.set(
      "redirect",
      pathname,
    );

    return NextResponse.redirect(loginUrl);
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
