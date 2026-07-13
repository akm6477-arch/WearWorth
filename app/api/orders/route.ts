import { NextRequest, NextResponse } from "next/server";

import { requireAuthUser } from "@/lib/auth";
import {
  isDatabaseUnavailableError,
  prisma,
} from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

interface OrderItemInput {
  slug?: unknown;
  size?: unknown;
  color?: unknown;
  quantity?: unknown;
}

interface NormalizedOrderItem {
  slug: string;
  size: string;
  color: string;
  quantity: number;
}

interface OrderBody {
  items?: unknown;
  shippingAddress?: unknown;
  deliveryMethod?: unknown;
  paymentMethod?: unknown;
}

const DELIVERY_METHODS = new Set(["STANDARD", "EXPRESS"]);
const PAYMENT_METHODS = new Set(["COD"]);

class OrderValidationError extends Error {}

function createOrderNumber() {
  const randomSuffix = Math.random()
    .toString(36)
    .slice(2, 9)
    .toUpperCase();

  return `WW-${Date.now().toString().slice(-8)}-${randomSuffix}`;
}

function normalizeItems(
  items: unknown,
): NormalizedOrderItem[] | null {
  if (!Array.isArray(items)) {
    return null;
  }

  return items.map((item) => {
    const value =
      typeof item === "object" && item !== null
        ? (item as OrderItemInput)
        : {};

    return {
      slug:
        typeof value.slug === "string"
          ? value.slug.trim()
          : "",
      size:
        typeof value.size === "string"
          ? value.size.trim()
          : "",
      color:
        typeof value.color === "string"
          ? value.color.trim()
          : "",
      quantity:
        typeof value.quantity === "number" &&
        Number.isFinite(value.quantity)
          ? Math.floor(value.quantity)
          : 0,
    };
  });
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

function assertValidItems(items: NormalizedOrderItem[] | null) {
  if (!items || items.length === 0) {
    throw new OrderValidationError(
      "Add at least one valid item before placing an order.",
    );
  }

  if (items.some((item) => !item.slug || item.quantity <= 0)) {
    throw new OrderValidationError(
      "Every order item must include a product and a positive quantity.",
    );
  }
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
  const rateLimited = rateLimit(request, {
    key: "create-order",
    limit: 10,
    windowMs: 60 * 1000,
  });

  if (rateLimited) {
    return rateLimited;
  }

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

    assertValidItems(normalizedItems);

    if (!shippingAddress) {
      throw new OrderValidationError(
        "Enter a complete delivery address.",
      );
    }

    if (!DELIVERY_METHODS.has(deliveryMethod)) {
      throw new OrderValidationError(
        "Choose a valid delivery method.",
      );
    }

    if (!PAYMENT_METHODS.has(paymentMethod)) {
      throw new OrderValidationError(
        "Choose a valid payment method.",
      );
    }

    const order = await prisma.$transaction(async (transaction) => {
      const items = normalizedItems!;
      const slugs = Array.from(
        new Set(items.map((item) => item.slug)),
      );

      const products = await transaction.product.findMany({
        where: {
          slug: {
            in: slugs,
          },
        },
        select: {
          id: true,
          slug: true,
          sku: true,
          name: true,
          price: true,
          image: true,
          category: true,
          statement: true,
          sizes: true,
          colors: true,
          stock: true,
          productStatus: true,
        },
      });

      const productMap = new Map(
        products.map((product) => [
          product.slug,
          product,
        ]),
      );
      const quantityBySlug = new Map<string, number>();

      const orderItems = items.map((item) => {
        const product = productMap.get(item.slug);

        if (!product) {
          throw new OrderValidationError(
            "One or more products could not be found.",
          );
        }

        if (product.productStatus !== "ACTIVE") {
          throw new OrderValidationError(
            `${product.name} is not available for purchase.`,
          );
        }

        if (
          product.sizes.length > 0 &&
          !product.sizes.includes(item.size)
        ) {
          throw new OrderValidationError(
            `Choose a valid size for ${product.name}.`,
          );
        }

        if (
          product.colors.length > 0 &&
          (!item.color || !product.colors.includes(item.color))
        ) {
          throw new OrderValidationError(
            `Choose a valid color for ${product.name}.`,
          );
        }

        const nextProductQuantity =
          (quantityBySlug.get(product.slug) || 0) + item.quantity;
        quantityBySlug.set(product.slug, nextProductQuantity);

        return {
          productId: product.id,
          slug: product.slug,
          sku: product.sku,
          name: product.name,
          image: product.image,
          category: product.category,
          statement: product.statement,
          size: item.size || "Default",
          color: item.color,
          price: product.price,
          quantity: item.quantity,
          total: product.price * item.quantity,
        };
      });

      quantityBySlug.forEach((quantity, slug) => {
        const product = productMap.get(slug);

        if (!product) {
          throw new OrderValidationError(
            "One or more products could not be validated.",
          );
        }

        if (quantity > product.stock) {
          throw new OrderValidationError(
            `Only ${product.stock} unit${product.stock === 1 ? "" : "s"} of ${product.name} are available.`,
          );
        }
      });

      const subtotal = orderItems.reduce(
        (sum, item) => sum + item.total,
        0,
      );
      const shipping =
        deliveryMethod === "EXPRESS"
          ? 199
          : subtotal >= 999
            ? 0
            : 99;
      const discount = 0;
      const total = subtotal + shipping - discount;

      const createdOrder = await transaction.order.create({
        data: {
          orderNumber: createOrderNumber(),
          userId: authResult.user!.id,
          items: orderItems,
          subtotal,
          shipping,
          discount,
          total,
          deliveryMethod,
          paymentMethod,
          paymentStatus: "PENDING",
          status: "PENDING",
          shippingAddress,
        },
      });

      for (const [slug, quantity] of quantityBySlug) {
        const stockUpdate = await transaction.product.updateMany({
          where: {
            slug,
            productStatus: "ACTIVE",
            stock: {
              gte: quantity,
            },
          },
          data: {
            stock: {
              decrement: quantity,
            },
          },
        });

        if (stockUpdate.count !== 1) {
          throw new OrderValidationError(
            "Stock changed while placing your order. Please review your bag and try again.",
          );
        }
      }

      return createdOrder;
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
    if (error instanceof OrderValidationError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 400,
        },
      );
    }

    console.error("CREATE_ORDER_API_ERROR", error);

    return NextResponse.json(
      {
        error: isDatabaseUnavailableError(error)
          ? "The database is temporarily unavailable. Please try again shortly."
          : "Unable to place your order right now.",
      },
      {
        status: isDatabaseUnavailableError(error) ? 503 : 500,
      },
    );
  }
}
