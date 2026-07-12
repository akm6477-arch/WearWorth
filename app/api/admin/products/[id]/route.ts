import { NextRequest, NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth";
import { deleteCloudinaryImage } from "@/lib/cloudinary";
import {
  isDatabaseUnavailableError,
  prisma,
} from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

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

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  const authResult = await requireAdminUser(request);

  if (!authResult.user) {
    return authResult.response;
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as ProductBody;
    const product = normalizeProductBody(body);
    const existingProduct = await prisma.product.findUnique({
      where: {
        id,
      },
      select: {
        imagePublicIds: true,
      },
    });

    const updatedProduct = await prisma.product.update({
      where: {
        id,
      },
      data: product,
    });

    const removedPublicIds =
      existingProduct?.imagePublicIds.filter(
        (publicId) =>
          !updatedProduct.imagePublicIds.includes(publicId),
      ) || [];

    if (removedPublicIds.length > 0) {
      await Promise.allSettled(
        removedPublicIds.map((publicId) =>
          deleteCloudinaryImage(publicId),
        ),
      );
    }

    return NextResponse.json({
      product: updatedProduct,
    });
  } catch (error) {
    console.error("ADMIN_UPDATE_PRODUCT_API_ERROR", error);

    return NextResponse.json(
      {
        error: isDatabaseUnavailableError(error)
          ? "The database is temporarily unavailable. Product update is blocked until MongoDB reconnects."
          : "Unable to update the product right now.",
      },
      {
        status: isDatabaseUnavailableError(error) ? 503 : 500,
      },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  const authResult = await requireAdminUser(request);

  if (!authResult.user) {
    return authResult.response;
  }

  try {
    const { id } = await context.params;
    const existingProduct = await prisma.product.findUnique({
      where: {
        id,
      },
      select: {
        imagePublicIds: true,
      },
    });

    await prisma.product.delete({
      where: {
        id,
      },
    });

    if (existingProduct?.imagePublicIds.length) {
      await Promise.allSettled(
        existingProduct.imagePublicIds.map((publicId) =>
          deleteCloudinaryImage(publicId),
        ),
      );
    }

    return NextResponse.json({
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("ADMIN_DELETE_PRODUCT_API_ERROR", error);

    return NextResponse.json(
      {
        error: isDatabaseUnavailableError(error)
          ? "The database is temporarily unavailable. Product delete is blocked until MongoDB reconnects."
          : "Unable to delete the product right now.",
      },
      {
        status: isDatabaseUnavailableError(error) ? 503 : 500,
      },
    );
  }
}
