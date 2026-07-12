import { NextRequest, NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth";
import {
  isDatabaseUnavailableError,
  prisma,
} from "@/lib/prisma";

interface StatusBody {
  orderId?: unknown;
  status?: unknown;
  paymentStatus?: unknown;
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdminUser(request);

  if (!authResult.user) {
    return authResult.response;
  }

  try {
    const orders = await prisma.order.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      orders,
    });
  } catch (error) {
    console.error("ADMIN_GET_ORDERS_API_ERROR", error);

    return NextResponse.json(
      {
        error: isDatabaseUnavailableError(error)
          ? "The database is temporarily unavailable. Please try again shortly."
          : "Unable to load admin orders right now.",
      },
      {
        status: isDatabaseUnavailableError(error) ? 503 : 500,
      },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireAdminUser(request);

  if (!authResult.user) {
    return authResult.response;
  }

  try {
    const body = (await request.json()) as StatusBody;
    const orderId =
      typeof body.orderId === "string"
        ? body.orderId
        : "";
    const status =
      typeof body.status === "string"
        ? body.status
        : undefined;
    const paymentStatus =
      typeof body.paymentStatus === "string"
        ? body.paymentStatus
        : undefined;

    if (!orderId || (!status && !paymentStatus)) {
      return NextResponse.json(
        {
          error: "Order ID and at least one status field are required.",
        },
        {
          status: 400,
        },
      );
    }

    const order = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        ...(status ? { status } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
      },
    });

    return NextResponse.json({
      order,
    });
  } catch (error) {
    console.error("ADMIN_UPDATE_ORDER_API_ERROR", error);

    return NextResponse.json(
      {
        error: "Unable to update the order right now.",
      },
      {
        status: 500,
      },
    );
  }
}
