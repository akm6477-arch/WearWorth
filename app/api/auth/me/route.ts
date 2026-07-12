import { NextRequest, NextResponse } from "next/server";

import {
  clearAuthCookie,
  getCurrentUserFromRequest,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("wearworth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { user: null },
        { status: 401 },
      );
    }

    const user = await getCurrentUserFromRequest(request);

    if (!user) {
      return clearAuthCookie(
        NextResponse.json(
          { user: null },
          { status: 401 },
        ),
      );
    }

    return NextResponse.json({
      user,
    });
  } catch (error) {
    console.error("ME_API_ERROR", error);

    return NextResponse.json(
      {
        error: "Unable to fetch current user.",
      },
      {
        status: 500,
      },
    );
  }
}
