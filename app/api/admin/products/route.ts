import { NextRequest, NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth";
import { getCatalogProducts } from "@/lib/catalog";
import {
  isDatabaseUnavailableError,
  prisma,
} from "@/lib/prisma";

interface ProductBody {
  slug?: unknown;
  name?: unknown;
  category?: unknown;
  collection?: unknown;
  statement?: unknown;
  description?: unknown;
  price?: unknown;
  originalPrice?: unknown;
  image?: unknown;
  images?: unknown;
  imagePublicIds?: unknown;
  sizes?: unknown;
  stock?: unknown;
  featured?: unknown;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "string" ? item.trim() : "",
      )
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeProductBody(body: ProductBody) {
  const name =
    typeof body.name === "string" ? body.name.trim() : "";
  const slugSource =
    typeof body.slug === "string" && body.slug.trim()
      ? body.slug
      : name;
  const images = parseStringArray(body.images);
  const imagePublicIds = parseStringArray(body.imagePublicIds);
  const primaryImage =
    typeof body.image === "string" && body.image.trim()
      ? body.image.trim()
      : images[0] || "/images/wearworth-logo.jpeg";

  return {
    slug: slugify(slugSource),
    name,
    category:
      typeof body.category === "string"
        ? body.category.trim()
        : "",
    collection:
      typeof body.collection === "string" &&
      body.collection.trim()
        ? body.collection.trim()
        : null,
    statement:
      typeof body.statement === "string"
        ? body.statement.trim()
        : "",
    description:
      typeof body.description === "string"
        ? body.description.trim()
        : "",
    price:
      typeof body.price === "number"
        ? body.price
        : Number(body.price),
    originalPrice:
      body.originalPrice === null ||
      body.originalPrice === undefined ||
      body.originalPrice === ""
        ? null
        : typeof body.originalPrice === "number"
          ? body.originalPrice
          : Number(body.originalPrice),
    image: primaryImage,
    images:
      images.length > 0
        ? images
        : [primaryImage],
    imagePublicIds,
    sizes: parseStringArray(body.sizes),
    stock:
      typeof body.stock === "number"
        ? Math.max(0, Math.floor(body.stock))
        : Math.max(0, Math.floor(Number(body.stock) || 0)),
    featured: body.featured === true,
  };
}

function validateProductInput(
  product: ReturnType<typeof normalizeProductBody>,
) {
  if (!product.slug) {
    return "Enter a valid product slug or name.";
  }

  if (product.name.length < 2) {
    return "Enter the product name.";
  }

  if (product.category.length < 2) {
    return "Enter a category.";
  }

  if (product.statement.length < 5) {
    return "Enter the product statement.";
  }

  if (product.description.length < 10) {
    return "Enter a fuller product description.";
  }

  if (!Number.isFinite(product.price) || product.price <= 0) {
    return "Enter a valid product price.";
  }

  if (
    product.originalPrice !== null &&
    (!Number.isFinite(product.originalPrice) ||
      product.originalPrice < product.price)
  ) {
    return "Original price must be empty or greater than or equal to price.";
  }

  if (!product.image) {
    return "Enter a primary image URL or path.";
  }

  if (product.sizes.length === 0) {
    return "Add at least one size.";
  }

  return null;
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdminUser(request);

  if (!authResult.user) {
    return authResult.response;
  }

  const { products, source } = await getCatalogProducts({
    sort: "featured",
  });

  return NextResponse.json({
    products,
    source,
  });
}

export async function POST(request: NextRequest) {
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

    const createdProduct = await prisma.product.create({
      data: product,
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
