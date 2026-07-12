import { NextRequest, NextResponse } from "next/server";

import { requireAuthUser } from "@/lib/auth";
import {
  isDatabaseUnavailableError,
  prisma,
} from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  const authResult = await requireAuthUser(request);

  if (!authResult.user) {
    return authResult.response;
  }

  const { id } = await context.params;

  let order;

  try {
    order = await prisma.order.findUnique({
      where: {
        id,
      },
    });
  } catch (error) {
    console.error("GET_ORDER_DETAIL_API_ERROR", error);

    return NextResponse.json(
      {
        error: isDatabaseUnavailableError(error)
          ? "The database is temporarily unavailable. Please try again shortly."
          : "Unable to load order details right now.",
      },
      {
        status: isDatabaseUnavailableError(error) ? 503 : 500,
      },
    );
  }

  if (!order) {
    return NextResponse.json(
      {
        error: "Order not found.",
      },
      {
        status: 404,
      },
    );
  }

  if (
    authResult.user.role !== "ADMIN" &&
    order.userId !== authResult.user.id
  ) {
    return NextResponse.json(
      {
        error: "You are not allowed to view this order.",
      },
      {
        status: 403,
      },
    );
  }

  return NextResponse.json({
    order,
  });
}
