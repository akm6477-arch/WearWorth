import { NextRequest, NextResponse } from "next/server";

import { requireAuthUser } from "@/lib/auth";
import { normalizeDbProduct } from "@/lib/catalog";
import type { CatalogProduct } from "@/lib/catalog-types";
import {
  isDatabaseUnavailableError,
  prisma,
} from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

interface CartInputItem {
  productId?: unknown;
  slug?: unknown;
  size?: unknown;
  color?: unknown;
  quantity?: unknown;
}

interface NormalizedCartInputItem {
  productId: string;
  slug: string;
  size: string;
  color: string;
  quantity: number;
}

interface SavedCartResponseItem {
  product: CatalogProduct;
  quantity: number;
  size: string;
  color: string;
}

const MAX_CART_QUANTITY = 10;
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

function normalizeCartItems(
  items: unknown,
): NormalizedCartInputItem[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.flatMap((item): NormalizedCartInputItem[] => {
    if (typeof item !== "object" || item === null) {
      return [];
    }

    const value = item as CartInputItem;
    const productId =
      typeof value.productId === "string" &&
      OBJECT_ID_PATTERN.test(value.productId)
        ? value.productId
        : "";
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

    if ((!productId && !slug) || quantity <= 0) {
      return [];
    }

    return [
      {
        productId,
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
  return {
    size:
      product.sizes.length === 0
        ? ""
        : product.sizes.includes(requestedSize)
          ? requestedSize
          : product.sizes[0],
    color:
      product.colors.length === 0
        ? ""
        : product.colors.includes(requestedColor)
          ? requestedColor
          : product.colors[0],
  };
}

async function readSavedCart(
  userId: string,
): Promise<SavedCartResponseItem[]> {
  const savedItems = await prisma.savedCartItem.findMany({
    where: {
      userId,
    },
    include: {
      product: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return savedItems.flatMap((item): SavedCartResponseItem[] => {
    const product = normalizeDbProduct(item.product);

    if (
      product.productStatus !== "ACTIVE" ||
      product.stock <= 0 ||
      item.quantity <= 0
    ) {
      return [];
    }

    const variant = resolveVariant(
      product,
      item.size,
      item.color,
    );

    return [
      {
        product,
        size: variant.size,
        color: variant.color,
        quantity: Math.min(
          item.quantity,
          product.stock,
          MAX_CART_QUANTITY,
        ),
      },
    ];
  });
}

async function buildSavableCartItems(
  incomingItems: NormalizedCartInputItem[],
) {
  if (incomingItems.length === 0) {
    return [];
  }

  const productIds = Array.from(
    new Set(
      incomingItems
        .map((item) => item.productId)
        .filter(Boolean),
    ),
  );
  const slugs = Array.from(
    new Set(
      incomingItems.map((item) => item.slug).filter(Boolean),
    ),
  );

  if (productIds.length === 0 && slugs.length === 0) {
    return [];
  }

  const products = await prisma.product.findMany({
    where: {
      OR: [
        ...(productIds.length
          ? [
              {
                id: {
                  in: productIds,
                },
              },
            ]
          : []),
        ...(slugs.length
          ? [
              {
                slug: {
                  in: slugs,
                },
              },
            ]
          : []),
      ],
    },
  });
  const productMap = new Map<string, CatalogProduct>();

  products.forEach((product) => {
    const normalizedProduct = normalizeDbProduct(product);
    productMap.set(normalizedProduct.id, normalizedProduct);
    productMap.set(normalizedProduct.slug, normalizedProduct);
  });

  const groupedItems = new Map<
    string,
    {
      productId: string;
      size: string;
      color: string;
      quantity: number;
    }
  >();

  incomingItems.forEach((item) => {
    const product =
      productMap.get(item.productId) || productMap.get(item.slug);

    if (
      !product ||
      product.productStatus !== "ACTIVE" ||
      product.stock <= 0
    ) {
      return;
    }

    const variant = resolveVariant(
      product,
      item.size,
      item.color,
    );
    const key = `${product.id}:${variant.size}:${variant.color}`;
    const currentQuantity = groupedItems.get(key)?.quantity || 0;

    groupedItems.set(key, {
      productId: product.id,
      size: variant.size,
      color: variant.color,
      quantity: Math.min(
        currentQuantity + item.quantity,
        product.stock,
        MAX_CART_QUANTITY,
      ),
    });
  });

  return Array.from(groupedItems.values());
}

async function replaceSavedCart(
  userId: string,
  items: NormalizedCartInputItem[],
) {
  const savableItems = await buildSavableCartItems(items);

  await prisma.$transaction(async (transaction) => {
    await transaction.savedCartItem.deleteMany({
      where: {
        userId,
      },
    });

    if (savableItems.length > 0) {
      await transaction.savedCartItem.createMany({
        data: savableItems.map((item) => ({
          userId,
          productId: item.productId,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
        })),
      });
    }
  });
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuthUser(request);

  if (!authResult.user) {
    return authResult.response;
  }

  try {
    const items = await readSavedCart(authResult.user.id);

    return NextResponse.json({
      items,
    });
  } catch (error) {
    console.error("GET_SAVED_CART_API_ERROR", error);

    return NextResponse.json(
      {
        error: isDatabaseUnavailableError(error)
          ? "The database is temporarily unavailable. Please try again shortly."
          : "Unable to load your saved bag right now.",
      },
      {
        status: isDatabaseUnavailableError(error) ? 503 : 500,
      },
    );
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = rateLimit(request, {
    key: "saved-cart-merge",
    limit: 20,
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
    const body = (await request.json()) as {
      items?: unknown;
    };
    const savedItems = await readSavedCart(authResult.user.id);
    const mergedInput = [
      ...savedItems.map((item) => ({
        productId: item.product.id,
        slug: item.product.slug,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
      })),
      ...normalizeCartItems(body.items),
    ];

    await replaceSavedCart(authResult.user.id, mergedInput);

    return NextResponse.json({
      items: await readSavedCart(authResult.user.id),
    });
  } catch (error) {
    console.error("MERGE_SAVED_CART_API_ERROR", error);

    return NextResponse.json(
      {
        error: isDatabaseUnavailableError(error)
          ? "The database is temporarily unavailable. Please try again shortly."
          : "Unable to sync your bag right now.",
      },
      {
        status: isDatabaseUnavailableError(error) ? 503 : 500,
      },
    );
  }
}

export async function PUT(request: NextRequest) {
  const rateLimited = rateLimit(request, {
    key: "saved-cart-replace",
    limit: 60,
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
    const body = (await request.json()) as {
      items?: unknown;
    };

    await replaceSavedCart(
      authResult.user.id,
      normalizeCartItems(body.items),
    );

    return NextResponse.json({
      items: await readSavedCart(authResult.user.id),
    });
  } catch (error) {
    console.error("REPLACE_SAVED_CART_API_ERROR", error);

    return NextResponse.json(
      {
        error: isDatabaseUnavailableError(error)
          ? "The database is temporarily unavailable. Please try again shortly."
          : "Unable to save your bag right now.",
      },
      {
        status: isDatabaseUnavailableError(error) ? 503 : 500,
      },
    );
  }
}
