import { NextRequest, NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth";
import {
  buildSkuFromSlug,
  normalizeProductBody,
  validateProductInput,
  type ProductBody,
} from "@/lib/admin-product-validation";
import type { CatalogProduct } from "@/lib/catalog-types";
import {
  isDatabaseUnavailableError,
  prisma,
} from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

function readString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : fallback;
}

function readNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

function readStringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      )
    : [];
}

function readObjectId(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "$oid" in value &&
    typeof value.$oid === "string"
  ) {
    return value.$oid;
  }

  return readString(value);
}

function readDate(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "$date" in value &&
    typeof value.$date === "string"
  ) {
    return value.$date;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return "2026-01-01T00:00:00.000Z";
}

function normalizeRawAdminProduct(
  document: Record<string, unknown>,
): CatalogProduct {
  const slug = readString(document.slug);
  const image = readString(
    document.image,
    "/images/wearworth-logo.jpeg",
  );
  const images = readStringList(document.images);

  return {
    id: readObjectId(document._id),
    slug,
    sku: readString(document.sku) || buildSkuFromSlug(slug),
    name: readString(document.name, "Untitled product"),
    category: readString(document.category, "Uncategorized"),
    audience:
      document.audience === "MEN" ||
      document.audience === "WOMEN" ||
      document.audience === "UNISEX"
        ? document.audience
        : "UNISEX",
    collection: readString(document.collection) || null,
    statement: readString(document.statement),
    description: readString(document.description),
    price: readNumber(document.price),
    originalPrice:
      typeof document.originalPrice === "number"
        ? document.originalPrice
        : undefined,
    image,
    images: Array.from(new Set([image, ...images].filter(Boolean))),
    imagePublicIds: readStringList(document.imagePublicIds),
    colors: readStringList(document.colors),
    material: readString(document.material, "Cotton blend"),
    fit: readString(document.fit, "Regular fit"),
    washCare: readString(
      document.washCare,
      "Machine wash cold inside out. Do not bleach.",
    ),
    sizes: readStringList(document.sizes),
    stock: Math.max(0, Math.floor(readNumber(document.stock))),
    lowStockThreshold: Math.max(
      0,
      Math.floor(readNumber(document.lowStockThreshold, 5)),
    ),
    featured: document.featured === true,
    productStatus:
      document.productStatus === "DRAFT" ? "DRAFT" : "ACTIVE",
    createdAt: readDate(document.createdAt),
    updatedAt: readDate(document.updatedAt),
  };
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdminUser(request);

  if (!authResult.user) {
    return authResult.response;
  }

  try {
    const rawProducts = await prisma.product.findRaw({
      options: {
        sort: {
          updatedAt: -1,
          name: 1,
        },
      },
    });
    const products = Array.isArray(rawProducts)
      ? rawProducts
          .filter(
            (product): product is Record<string, unknown> =>
              typeof product === "object" && product !== null,
          )
          .map(normalizeRawAdminProduct)
      : [];

    return NextResponse.json({
      products,
      source: "database",
    });
  } catch (error) {
    console.error("ADMIN_GET_PRODUCTS_API_ERROR", error);

    return NextResponse.json(
      {
        error: isDatabaseUnavailableError(error)
          ? "The database is temporarily unavailable. Product management is blocked until MongoDB reconnects."
          : "Unable to load admin products right now.",
      },
      {
        status: isDatabaseUnavailableError(error) ? 503 : 500,
      },
    );
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = rateLimit(request, {
    key: "admin-create-product",
    limit: 40,
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
    const body = (await request.json()) as ProductBody;
    const product = normalizeProductBody(body);
    const validationError = validateProductInput(product);

    if (validationError) {
      return NextResponse.json(
        {
          error: validationError,
        },
        {
          status: 400,
        },
      );
    }

    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [
          {
            slug: product.data.slug,
          },
          {
            sku: product.data.sku,
          },
        ],
      },
      select: {
        id: true,
        slug: true,
        sku: true,
      },
    });

    if (existingProduct) {
      const duplicateField =
        existingProduct.slug === product.data.slug
          ? "slug"
          : "SKU";

      return NextResponse.json(
        {
          error: `A product with this ${duplicateField} already exists.`,
        },
        {
          status: 409,
        },
      );
    }

    const createdProduct = await prisma.product.create({
      data: product.data,
    });

    return NextResponse.json(
      {
        product: createdProduct,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("ADMIN_CREATE_PRODUCT_API_ERROR", error);

    return NextResponse.json(
      {
        error: isDatabaseUnavailableError(error)
          ? "The database is temporarily unavailable. Product save is blocked until MongoDB reconnects."
          : "Unable to create the product right now.",
      },
      {
        status: isDatabaseUnavailableError(error) ? 503 : 500,
      },
    );
  }
}
