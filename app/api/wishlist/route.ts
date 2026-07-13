import { NextRequest, NextResponse } from "next/server";

import { requireAuthUser } from "@/lib/auth";
import {
  isDatabaseUnavailableError,
  prisma,
} from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

interface WishlistBody {
  slugs?: unknown;
}

function normalizeSlugs(slugs: unknown) {
  if (!Array.isArray(slugs)) {
    return [];
  }

  return Array.from(
    new Set(
      slugs
        .map((slug) =>
          typeof slug === "string" ? slug.trim() : "",
        )
        .filter(Boolean),
    ),
  );
}

async function readSavedWishlist(userId: string) {
  const items = await prisma.wishlistItem.findMany({
    where: {
      userId,
    },
    include: {
      product: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return items
    .filter((item) => item.product.productStatus === "ACTIVE")
    .map((item) => item.product.slug);
}

async function replaceSavedWishlist(
  userId: string,
  slugs: string[],
) {
  if (slugs.length === 0) {
    await prisma.wishlistItem.deleteMany({
      where: {
        userId,
      },
    });
    return;
  }

  const products = await prisma.product.findMany({
    where: {
      slug: {
        in: slugs,
      },
      productStatus: "ACTIVE",
    },
    select: {
      id: true,
    },
  });

  await prisma.$transaction(async (transaction) => {
    await transaction.wishlistItem.deleteMany({
      where: {
        userId,
      },
    });

    if (products.length > 0) {
      await transaction.wishlistItem.createMany({
        data: products.map((product) => ({
          userId,
          productId: product.id,
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
    return NextResponse.json({
      slugs: await readSavedWishlist(authResult.user.id),
    });
  } catch (error) {
    console.error("GET_SAVED_WISHLIST_API_ERROR", error);

    return NextResponse.json(
      {
        error: isDatabaseUnavailableError(error)
          ? "The database is temporarily unavailable. Please try again shortly."
          : "Unable to load your saved wishlist right now.",
      },
      {
        status: isDatabaseUnavailableError(error) ? 503 : 500,
      },
    );
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = rateLimit(request, {
    key: "saved-wishlist-merge",
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
    const body = (await request.json()) as WishlistBody;
    const mergedSlugs = Array.from(
      new Set([
        ...(await readSavedWishlist(authResult.user.id)),
        ...normalizeSlugs(body.slugs),
      ]),
    );

    await replaceSavedWishlist(authResult.user.id, mergedSlugs);

    return NextResponse.json({
      slugs: await readSavedWishlist(authResult.user.id),
    });
  } catch (error) {
    console.error("MERGE_SAVED_WISHLIST_API_ERROR", error);

    return NextResponse.json(
      {
        error: isDatabaseUnavailableError(error)
          ? "The database is temporarily unavailable. Please try again shortly."
          : "Unable to sync your wishlist right now.",
      },
      {
        status: isDatabaseUnavailableError(error) ? 503 : 500,
      },
    );
  }
}

export async function PUT(request: NextRequest) {
  const rateLimited = rateLimit(request, {
    key: "saved-wishlist-replace",
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
    const body = (await request.json()) as WishlistBody;

    await replaceSavedWishlist(
      authResult.user.id,
      normalizeSlugs(body.slugs),
    );

    return NextResponse.json({
      slugs: await readSavedWishlist(authResult.user.id),
    });
  } catch (error) {
    console.error("REPLACE_SAVED_WISHLIST_API_ERROR", error);

    return NextResponse.json(
      {
        error: isDatabaseUnavailableError(error)
          ? "The database is temporarily unavailable. Please try again shortly."
          : "Unable to save your wishlist right now.",
      },
      {
        status: isDatabaseUnavailableError(error) ? 503 : 500,
      },
    );
  }
}
