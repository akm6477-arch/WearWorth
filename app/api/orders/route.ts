import { NextRequest, NextResponse } from "next/server";

import { requireAuthUser } from "@/lib/auth";
import { getTrustedProductsBySlugs } from "@/lib/products";
import {
  isDatabaseUnavailableError,
  prisma,
} from "@/lib/prisma";

interface OrderItemInput {
  slug?: unknown;
  size?: unknown;
  quantity?: unknown;
}

interface OrderBody {
  items?: unknown;
  shippingAddress?: unknown;
  deliveryMethod?: unknown;
  paymentMethod?: unknown;
}

const DELIVERY_METHODS = new Set(["STANDARD", "EXPRESS"]);
const PAYMENT_METHODS = new Set(["COD", "ONLINE"]);

function createOrderNumber() {
  const randomSuffix = Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase();

  return `WW-${Date.now().toString().slice(-6)}-${randomSuffix}`;
}

function normalizeItems(items: unknown) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => item as OrderItemInput)
    .map((item) => ({
      slug:
        typeof item.slug === "string" ? item.slug : "",
      size:
        typeof item.size === "string" ? item.size : "",
      quantity:
        typeof item.quantity === "number"
          ? Math.max(1, Math.min(10, Math.floor(item.quantity)))
          : 0,
    }))
    .filter((item) => item.slug && item.quantity > 0);
}

function normalizeShippingAddress(shippingAddress: unknown) {
  if (
    typeof shippingAddress !== "object" ||
    shippingAddress === null
  ) {
    return null;
  }

  const value = shippingAddress as Record<string, unknown>;

  const normalized = {
    fullName:
      typeof value.fullName === "string"
        ? value.fullName.trim()
        : "",
    email:
      typeof value.email === "string"
        ? value.email.trim().toLowerCase()
        : "",
    phone:
      typeof value.phone === "string"
        ? value.phone.replace(/\D/g, "").slice(0, 10)
        : "",
    address:
      typeof value.address === "string"
        ? value.address.trim()
        : "",
    apartment:
      typeof value.apartment === "string"
        ? value.apartment.trim()
        : "",
    city:
      typeof value.city === "string"
        ? value.city.trim()
        : "",
    state:
      typeof value.state === "string"
        ? value.state.trim()
        : "",
    pincode:
      typeof value.pincode === "string"
        ? value.pincode.replace(/\D/g, "").slice(0, 6)
        : "",
    landmark:
      typeof value.landmark === "string"
        ? value.landmark.trim()
        : "",
  };

  if (
    normalized.fullName.length < 2 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email) ||
    !/^[6-9]\d{9}$/.test(normalized.phone) ||
    normalized.address.length < 5 ||
    normalized.city.length < 2 ||
    normalized.state.length < 2 ||
    !/^\d{6}$/.test(normalized.pincode)
  ) {
    return null;
  }

  return normalized;
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuthUser(request);

  if (!authResult.user) {
    return authResult.response;
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        userId:
          authResult.user.role === "ADMIN" &&
          request.nextUrl.searchParams.get("scope") === "all"
            ? undefined
            : authResult.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      orders,
    });
  } catch (error) {
    console.error("GET_ORDERS_API_ERROR", error);

    return NextResponse.json(
      {
        error: isDatabaseUnavailableError(error)
          ? "The database is temporarily unavailable. Please try again shortly."
          : "Unable to load orders right now.",
      },
      {
        status: isDatabaseUnavailableError(error) ? 503 : 500,
      },
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuthUser(request);

  if (!authResult.user) {
    return authResult.response;
  }

  try {
    const body = (await request.json()) as OrderBody;
    const normalizedItems = normalizeItems(body.items);
    const shippingAddress = normalizeShippingAddress(
      body.shippingAddress,
    );
    const deliveryMethod =
      typeof body.deliveryMethod === "string"
        ? body.deliveryMethod
        : "";
    const paymentMethod =
      typeof body.paymentMethod === "string"
        ? body.paymentMethod
        : "";

    if (!normalizedItems.length) {
      return NextResponse.json(
        {
          error: "Add at least one valid item before placing an order.",
        },
        {
          status: 400,
        },
      );
    }

    if (!shippingAddress) {
      return NextResponse.json(
        {
          error: "Enter a complete delivery address.",
        },
        {
          status: 400,
        },
      );
    }

    if (!DELIVERY_METHODS.has(deliveryMethod)) {
      return NextResponse.json(
        {
          error: "Choose a valid delivery method.",
        },
        {
          status: 400,
        },
      );
    }

    if (!PAYMENT_METHODS.has(paymentMethod)) {
      return NextResponse.json(
        {
          error: "Choose a valid payment method.",
        },
        {
          status: 400,
        },
      );
    }

    if (paymentMethod !== "COD") {
      return NextResponse.json(
        {
          error:
            "Cash on Delivery is supported first. Razorpay is not connected yet.",
        },
        {
          status: 400,
        },
      );
    }

    const trustedProducts = await getTrustedProductsBySlugs(
      normalizedItems.map((item) => item.slug),
    );

    const productMap = new Map(
      trustedProducts.map((product) => [
        product.slug,
        product,
      ]),
    );

    const orderItems = normalizedItems.map((item) => {
      const product = productMap.get(item.slug);

      if (!product) {
        return null;
      }

      return {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.image,
        category: product.category,
        statement: product.statement,
        size: item.size || "Default",
        price: product.price,
        quantity: item.quantity,
        total: product.price * item.quantity,
      };
    });

    if (orderItems.some((item) => item === null)) {
      return NextResponse.json(
        {
          error:
            "One or more products could not be validated on the server.",
        },
        {
          status: 400,
        },
      );
    }

    const safeOrderItems = orderItems.filter(
      (item): item is NonNullable<typeof item> => Boolean(item),
    );

    const subtotal = safeOrderItems.reduce(
      (sum, item) => sum + item.total,
      0,
    );
    const shipping = deliveryMethod === "EXPRESS"
      ? 199
      : subtotal >= 999
        ? 0
        : 99;
    const discount = 0;
    const total = subtotal + shipping - discount;

    const order = await prisma.order.create({
      data: {
        orderNumber: createOrderNumber(),
        userId: authResult.user.id,
        items: safeOrderItems,
        subtotal,
        shipping,
        discount,
        total,
        deliveryMethod,
        paymentMethod,
        paymentStatus: "PENDING",
        status: "PLACED",
        shippingAddress,
      },
    });

    return NextResponse.json(
      {
        order,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("CREATE_ORDER_API_ERROR", error);

    return NextResponse.json(
      {
        error: "Unable to place your order right now.",
      },
      {
        status: 500,
      },
    );
  }
}
