import type {
  CatalogProduct,
  ProductQueryOptions,
  ProductSortOption,
} from "@/lib/catalog-types";
import { products as staticProducts } from "@/app/data/products";
import {
  isDatabaseUnavailableError,
  prisma,
} from "@/lib/prisma";

function normalizeStaticProduct(
  product: CatalogProduct,
): CatalogProduct {
  return {
    ...product,
    collection: product.collection || null,
    images:
      product.images?.length > 0
        ? product.images
        : [product.image],
    imagePublicIds: product.imagePublicIds || [],
    stock: product.stock ?? 0,
    featured: Boolean(product.featured),
  };
}

function normalizeDbProduct(product: {
  id: string;
  slug: string;
  name: string;
  category: string;
  collection?: string | null;
  statement: string;
  description: string;
  price: number;
  originalPrice: number | null;
  image: string;
  images: string[];
  imagePublicIds?: string[];
  sizes: string[];
  stock: number;
  featured: boolean;
}): CatalogProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    collection: product.collection ?? null,
    statement: product.statement,
    description: product.description,
    price: Number(product.price),
    originalPrice: product.originalPrice ?? undefined,
    image: product.image,
    images:
      product.images?.length > 0
        ? product.images
        : [product.image],
    imagePublicIds: product.imagePublicIds || [],
    sizes: product.sizes,
    stock: product.stock,
    featured: product.featured,
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

  const matchesCategory =
    !normalizedCategory ||
    normalizedCategory === "all" ||
    product.category.toLowerCase() === normalizedCategory;

  const matchesSearch =
    !normalizedSearch ||
    product.name.toLowerCase().includes(normalizedSearch) ||
    product.description
      .toLowerCase()
      .includes(normalizedSearch) ||
    product.category.toLowerCase().includes(normalizedSearch) ||
    product.statement
      .toLowerCase()
      .includes(normalizedSearch) ||
    (product.collection || "")
      .toLowerCase()
      .includes(normalizedSearch);

  return (
    matchesCategory &&
    matchesSearch &&
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
        return secondProduct.id.localeCompare(firstProduct.id);
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

    if (dbProduct) {
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
    (product) => product.slug === slug,
  );

  return {
    product: staticProduct
      ? normalizeStaticProduct(staticProduct)
      : null,
    source: "static-fallback" as const,
  };
}
