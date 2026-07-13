import type {
  CatalogProduct,
  ProductAudience,
  ProductQueryOptions,
  ProductSortOption,
  ProductStatus,
} from "@/lib/catalog-types";
import { products as staticProducts } from "@/app/data/products";
import {
  isDatabaseUnavailableError,
  prisma,
} from "@/lib/prisma";

const FALLBACK_PRODUCT_IMAGE = "/images/wearworth-logo.jpeg";
const DEFAULT_CREATED_AT = "2026-01-01T00:00:00.000Z";

function buildSkuFromSlug(slug: string) {
  const skuBody = slug
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 54);

  return skuBody ? `WW-${skuBody}` : "WW-PRODUCT";
}

function normalizeAudience(
  audience?: string | null,
): ProductAudience {
  return audience === "MEN" ||
    audience === "WOMEN" ||
    audience === "UNISEX"
    ? audience
    : "UNISEX";
}

function normalizeProductStatus(
  productStatus?: string | null,
): ProductStatus {
  return productStatus === "DRAFT" ? "DRAFT" : "ACTIVE";
}

function normalizeDateValue(value?: Date | string | null) {
  if (!value) {
    return DEFAULT_CREATED_AT;
  }

  return value instanceof Date ? value.toISOString() : value;
}

function normalizeImages(image: string, images?: string[] | null) {
  const primaryImage = image || images?.[0] || FALLBACK_PRODUCT_IMAGE;
  const galleryImages =
    images && images.length > 0 ? images : [primaryImage];

  return {
    image: primaryImage,
    images: Array.from(new Set([primaryImage, ...galleryImages])),
  };
}

function normalizeStaticProduct(
  product: CatalogProduct,
): CatalogProduct {
  const normalizedImages = normalizeImages(
    product.image,
    product.images,
  );

  return {
    ...product,
    sku: product.sku || buildSkuFromSlug(product.slug),
    audience: normalizeAudience(product.audience),
    collection: product.collection || null,
    image: normalizedImages.image,
    images: normalizedImages.images,
    imagePublicIds: product.imagePublicIds || [],
    colors:
      product.colors && product.colors.length > 0
        ? product.colors
        : ["Black", "White"],
    material: product.material || "Cotton blend",
    fit: product.fit || "Regular fit",
    washCare:
      product.washCare ||
      "Machine wash cold inside out. Do not bleach.",
    stock: product.stock ?? 0,
    lowStockThreshold: product.lowStockThreshold ?? 5,
    featured: Boolean(product.featured),
    productStatus: normalizeProductStatus(product.productStatus),
    createdAt: normalizeDateValue(product.createdAt),
    updatedAt: normalizeDateValue(product.updatedAt),
  };
}

export function normalizeDbProduct(product: {
  id: string;
  slug: string;
  sku?: string | null;
  name: string;
  category: string;
  audience?: string | null;
  collection?: string | null;
  statement: string;
  description: string;
  price: number;
  originalPrice: number | null;
  image: string;
  images: string[];
  imagePublicIds?: string[];
  colors?: string[];
  material?: string | null;
  fit?: string | null;
  washCare?: string | null;
  sizes: string[];
  stock: number;
  lowStockThreshold?: number | null;
  featured: boolean;
  productStatus?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}): CatalogProduct {
  const normalizedImages = normalizeImages(
    product.image,
    product.images,
  );

  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku || buildSkuFromSlug(product.slug),
    name: product.name,
    category: product.category,
    audience: normalizeAudience(product.audience),
    collection: product.collection ?? null,
    statement: product.statement,
    description: product.description,
    price: Number(product.price),
    originalPrice: product.originalPrice ?? undefined,
    image: normalizedImages.image,
    images: normalizedImages.images,
    imagePublicIds: product.imagePublicIds || [],
    colors:
      product.colors && product.colors.length > 0
        ? product.colors
        : ["Black", "White"],
    material: product.material || "Cotton blend",
    fit: product.fit || "Regular fit",
    washCare:
      product.washCare ||
      "Machine wash cold inside out. Do not bleach.",
    sizes: product.sizes,
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold ?? 5,
    featured: product.featured,
    productStatus: normalizeProductStatus(product.productStatus),
    createdAt: normalizeDateValue(product.createdAt),
    updatedAt: normalizeDateValue(product.updatedAt),
  };
}

function matchesFilters(
  product: CatalogProduct,
  options: ProductQueryOptions,
) {
  const normalizedSearch =
    options.search?.trim().toLowerCase() || "";
  const normalizedCategory =
    options.category?.trim().toLowerCase() || "";
  const normalizedAudience =
    options.audience?.trim().toLowerCase() || "";

  const matchesCategory =
    !normalizedCategory ||
    normalizedCategory === "all" ||
    product.category.toLowerCase() === normalizedCategory;
  const matchesAudience =
    !normalizedAudience ||
    normalizedAudience === "all" ||
    product.audience.toLowerCase() === normalizedAudience;

  const matchesSearch =
    !normalizedSearch ||
    product.sku.toLowerCase().includes(normalizedSearch) ||
    product.name.toLowerCase().includes(normalizedSearch) ||
    product.description
      .toLowerCase()
      .includes(normalizedSearch) ||
    product.category.toLowerCase().includes(normalizedSearch) ||
    product.statement
      .toLowerCase()
      .includes(normalizedSearch) ||
    product.colors.some((color) =>
      color.toLowerCase().includes(normalizedSearch),
    ) ||
    product.material.toLowerCase().includes(normalizedSearch) ||
    product.fit.toLowerCase().includes(normalizedSearch) ||
    (product.collection || "")
      .toLowerCase()
      .includes(normalizedSearch);

  return (
    matchesCategory &&
    matchesAudience &&
    matchesSearch &&
    (options.includeDrafts ||
      product.productStatus === "ACTIVE") &&
    (!options.featuredOnly || product.featured)
  );
}

function sortProducts(
  products: CatalogProduct[],
  sort: ProductSortOption = "featured",
) {
  return [...products].sort((firstProduct, secondProduct) => {
    switch (sort) {
      case "price-low":
        return firstProduct.price - secondProduct.price;
      case "price-high":
        return secondProduct.price - firstProduct.price;
      case "name-az":
        return firstProduct.name.localeCompare(
          secondProduct.name,
        );
      case "name-za":
        return secondProduct.name.localeCompare(
          firstProduct.name,
        );
      case "newest":
        return secondProduct.updatedAt.localeCompare(
          firstProduct.updatedAt,
        );
      case "featured":
      default:
        return (
          Number(secondProduct.featured) -
            Number(firstProduct.featured) ||
          secondProduct.name.localeCompare(firstProduct.name)
        );
    }
  });
}

export async function getCatalogProducts(
  options: ProductQueryOptions = {},
) {
  try {
    const dbProducts = await prisma.product.findMany({
      where: options.includeDrafts
        ? undefined
        : {
            productStatus: "ACTIVE",
          },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const normalizedProducts = dbProducts.map(normalizeDbProduct);
    const filteredProducts = normalizedProducts.filter((product) =>
      matchesFilters(product, options),
    );

    return {
      products: sortProducts(
        filteredProducts,
        options.sort,
      ),
      source: "database" as const,
    };
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      console.error("CATALOG_PRODUCTS_ERROR", error);
    }

    const fallbackProducts = staticProducts
      .map(normalizeStaticProduct)
      .filter((product) => matchesFilters(product, options));

    return {
      products: sortProducts(
        fallbackProducts,
        options.sort,
      ),
      source: "static-fallback" as const,
    };
  }
}

export async function getCatalogProductBySlug(slug: string) {
  try {
    const dbProduct = await prisma.product.findUnique({
      where: {
        slug,
      },
    });

    if (
      dbProduct &&
      normalizeProductStatus(dbProduct.productStatus) === "ACTIVE"
    ) {
      return {
        product: normalizeDbProduct(dbProduct),
        source: "database" as const,
      };
    }
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      console.error("CATALOG_PRODUCT_ERROR", error);
    }
  }

  const staticProduct = staticProducts.find(
    (product) =>
      product.slug === slug &&
      normalizeProductStatus(product.productStatus) === "ACTIVE",
  );

  return {
    product: staticProduct
      ? normalizeStaticProduct(staticProduct)
      : null,
    source: "static-fallback" as const,
  };
}
