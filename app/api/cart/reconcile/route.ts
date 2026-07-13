import { NextRequest, NextResponse } from "next/server";

import { normalizeDbProduct } from "@/lib/catalog";
import type { CatalogProduct } from "@/lib/catalog-types";
import {
  isDatabaseUnavailableError,
  prisma,
} from "@/lib/prisma";

interface CartReconcileInput {
  slug?: unknown;
  size?: unknown;
  color?: unknown;
  quantity?: unknown;
}

interface ReconciledCartItem {
  product: CatalogProduct;
  quantity: number;
  size: string;
  color: string;
  lineTotal: number;
}

const MAX_CART_QUANTITY = 10;
const FREE_SHIPPING_THRESHOLD = 999;

function normalizeInputItems(items: unknown) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.flatMap((item) => {
    if (typeof item !== "object" || item === null) {
      return [];
    }

    const value = item as CartReconcileInput;
    const slug =
      typeof value.slug === "string" ? value.slug.trim() : "";
    const size =
      typeof value.size === "string" ? value.size.trim() : "";
    const color =
      typeof value.color === "string" ? value.color.trim() : "";
    const quantity =
      typeof value.quantity === "number" &&
      Number.isFinite(value.quantity)
        ? Math.floor(value.quantity)
        : 0;

    if (!slug || quantity <= 0) {
      return [];
    }

    return [
      {
        slug,
        size,
        color,
        quantity: Math.min(quantity, MAX_CART_QUANTITY),
      },
    ];
  });
}

function resolveVariant(
  product: CatalogProduct,
  requestedSize: string,
  requestedColor: string,
) {
  const size =
    product.sizes.length === 0
      ? ""
      : product.sizes.includes(requestedSize)
        ? requestedSize
        : product.sizes[0];
  const color =
    product.colors.length === 0
      ? ""
      : product.colors.includes(requestedColor)
        ? requestedColor
        : product.colors[0];

  return {
    size,
    color,
    changed:
      size !== requestedSize ||
      color !== requestedColor,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      items?: unknown;
    };
    const inputItems = normalizeInputItems(body.items);

    if (inputItems.length === 0) {
      return NextResponse.json({
        items: [],
        subtotal: 0,
        shipping: 0,
        total: 0,
        changed: false,
        notices: [],
      });
    }

    const slugs = Array.from(
      new Set(inputItems.map((item) => item.slug)),
    );
    const products = await prisma.product.findMany({
      where: {
        slug: {
          in: slugs,
        },
      },
    });
    const productMap = new Map(
      products.map((product) => [
        product.slug,
        normalizeDbProduct(product),
      ]),
    );
    const notices: string[] = [];
    const groupedItems = new Map<string, ReconciledCartItem>();

    inputItems.forEach((item) => {
      const product = productMap.get(item.slug);

      if (!product || product.productStatus !== "ACTIVE") {
        notices.push(
          "An unavailable product was removed from your bag.",
        );
        return;
      }

      if (product.stock <= 0) {
        notices.push(`${product.name} is currently out of stock.`);
        return;
      }

      const variant = resolveVariant(
        product,
        item.size,
        item.color,
      );
      const key = `${product.id}:${variant.size}:${variant.color}`;
      const existingItem = groupedItems.get(key);
      const currentQuantity = existingItem?.quantity || 0;
      const quantity = Math.min(
        currentQuantity + item.quantity,
        product.stock,
        MAX_CART_QUANTITY,
      );

      if (quantity < currentQuantity + item.quantity) {
        notices.push(
          `${product.name} quantity was adjusted to available stock.`,
        );
      }

      if (variant.changed) {
        notices.push(
          `${product.name} options were refreshed from current product data.`,
        );
      }

      groupedItems.set(key, {
        product,
        size: variant.size,
        color: variant.color,
        quantity,
        lineTotal: product.price * quantity,
      });
    });

    const reconciledItems = Array.from(groupedItems.values());
    const subtotal = reconciledItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0,
    );
    const shipping =
      subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 99;

    return NextResponse.json({
      items: reconciledItems,
      subtotal,
      shipping,
      total: subtotal + shipping,
      changed:
        notices.length > 0 ||
        reconciledItems.length !== inputItems.length,
      notices: Array.from(new Set(notices)),
    });
  } catch (error) {
    console.error("CART_RECONCILE_API_ERROR", error);

    return NextResponse.json(
      {
        error: isDatabaseUnavailableError(error)
          ? "The database is temporarily unavailable. Please try again shortly."
          : "Unable to refresh your bag right now.",
      },
      {
        status: isDatabaseUnavailableError(error) ? 503 : 500,
      },
    );
  }
}
