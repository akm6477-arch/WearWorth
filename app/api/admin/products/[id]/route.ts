import { NextRequest, NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth";
import {
  normalizeProductBody,
  validateProductInput,
  type ProductBody,
} from "@/lib/admin-product-validation";
import { deleteCloudinaryImages } from "@/lib/cloudinary";
import {
  isDatabaseUnavailableError,
  prisma,
} from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  const rateLimited = rateLimit(request, {
    key: "admin-update-product",
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
    const { id } = await context.params;
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

    const existingProduct = await prisma.product.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        imagePublicIds: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        {
          error: "Product not found.",
        },
        {
          status: 404,
        },
      );
    }

    const duplicateProduct = await prisma.product.findFirst({
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

    if (duplicateProduct && duplicateProduct.id !== id) {
      const duplicateField =
        duplicateProduct.slug === product.data.slug
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

    const updatedProduct = await prisma.product.update({
      where: {
        id,
      },
      data: product.data,
    });

    const removedPublicIds =
      existingProduct.imagePublicIds.filter(
        (publicId) =>
          !updatedProduct.imagePublicIds.includes(publicId),
      );

    if (removedPublicIds.length > 0) {
      await deleteCloudinaryImages(removedPublicIds);
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
  const rateLimited = rateLimit(request, {
    key: "admin-delete-product",
    limit: 20,
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
    const { id } = await context.params;
    const existingProduct = await prisma.product.findUnique({
      where: {
        id,
      },
      select: {
        imagePublicIds: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        {
          error: "Product not found.",
        },
        {
          status: 404,
        },
      );
    }

    await prisma.product.delete({
      where: {
        id,
      },
    });

    if (existingProduct.imagePublicIds.length) {
      await deleteCloudinaryImages(existingProduct.imagePublicIds);
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
