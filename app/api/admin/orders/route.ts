import { NextRequest, NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth";
import {
  isOrderStatus,
  isPaymentStatus,
} from "@/lib/order-status";
import {
  isDatabaseUnavailableError,
  prisma,
} from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

interface StatusBody {
  orderId?: unknown;
  status?: unknown;
  paymentStatus?: unknown;
}

const DEFAULT_PAGE_SIZE = 8;
const MAX_PAGE_SIZE = 25;

function readPositiveInteger(value: string | null, fallback: number) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return Math.floor(parsedValue);
}

function readShippingAddress(value: unknown) {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  return value as {
    fullName?: unknown;
    email?: unknown;
  };
}

function readSearchText(value: unknown) {
  return typeof value === "string" ? value.toLowerCase() : "";
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdminUser(request);

  if (!authResult.user) {
    return authResult.response;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const search = (searchParams.get("search") || "")
      .trim()
      .toLowerCase();
    const status = searchParams.get("status") || "All";
    const paymentStatus =
      searchParams.get("paymentStatus") || "All";
    const page = readPositiveInteger(
      searchParams.get("page"),
      1,
    );
    const pageSize = Math.min(
      readPositiveInteger(
        searchParams.get("pageSize"),
        DEFAULT_PAGE_SIZE,
      ),
      MAX_PAGE_SIZE,
    );

    if (status !== "All" && !isOrderStatus(status)) {
      return NextResponse.json(
        {
          error: "Choose a valid order status.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      paymentStatus !== "All" &&
      !isPaymentStatus(paymentStatus)
    ) {
      return NextResponse.json(
        {
          error: "Choose a valid payment status.",
        },
        {
          status: 400,
        },
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        ...(status !== "All" ? { status } : {}),
        ...(paymentStatus !== "All" ? { paymentStatus } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    const filteredOrders = search
      ? orders.filter((order) => {
          const shippingAddress = readShippingAddress(
            order.shippingAddress,
          );

          return [
            order.id,
            order.orderNumber,
            order.userId,
            shippingAddress.fullName,
            shippingAddress.email,
          ].some((value) =>
            readSearchText(value).includes(search),
          );
        })
      : orders;
    const total = filteredOrders.length;
    const totalPages = Math.max(
      1,
      Math.ceil(total / pageSize),
    );
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * pageSize;

    return NextResponse.json({
      orders: filteredOrders.slice(
        startIndex,
        startIndex + pageSize,
      ),
      pagination: {
        page: safePage,
        pageSize,
        total,
        totalPages,
      },
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
  const rateLimited = rateLimit(request, {
    key: "admin-update-order",
    limit: 60,
    windowMs: 60 * 1000,
  });

  if (rateLimited) {
    return rateLimited;
  }

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

    if (status && !isOrderStatus(status)) {
      return NextResponse.json(
        {
          error: "Choose a valid order status.",
        },
        {
          status: 400,
        },
      );
    }

    if (paymentStatus && !isPaymentStatus(paymentStatus)) {
      return NextResponse.json(
        {
          error: "Choose a valid payment status.",
        },
        {
          status: 400,
        },
      );
    }

    const existingOrder = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        {
          error: "Order not found.",
        },
        {
          status: 404,
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
        error: isDatabaseUnavailableError(error)
          ? "The database is temporarily unavailable. Please try again shortly."
          : "Unable to update the order right now.",
      },
      {
        status: isDatabaseUnavailableError(error) ? 503 : 500,
      },
    );
  }
}
