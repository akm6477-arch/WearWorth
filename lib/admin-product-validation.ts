import type {
  ProductAudience,
  ProductStatus,
} from "@/lib/catalog-types";

export interface ProductBody {
  slug?: unknown;
  sku?: unknown;
  name?: unknown;
  category?: unknown;
  audience?: unknown;
  collection?: unknown;
  statement?: unknown;
  description?: unknown;
  price?: unknown;
  originalPrice?: unknown;
  image?: unknown;
  images?: unknown;
  imagePublicIds?: unknown;
  colors?: unknown;
  material?: unknown;
  fit?: unknown;
  washCare?: unknown;
  sizes?: unknown;
  stock?: unknown;
  lowStockThreshold?: unknown;
  featured?: unknown;
  productStatus?: unknown;
}

const FALLBACK_PRODUCT_IMAGE = "/images/wearworth-logo.jpeg";
const MAX_GALLERY_IMAGES = 12;
const MAX_PRODUCT_SIZES = 12;

export function slugifyProductValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildSkuFromSlug(slug: string) {
  const skuBody = slug
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 54);

  return skuBody ? `WW-${skuBody}` : "";
}

export function normalizeSku(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseStringList(value: unknown) {
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

function uniqueList(values: string[]) {
  return Array.from(new Set(values));
}

function toFiniteNumber(value: unknown) {
  return typeof value === "number" ? value : Number(value);
}

function normalizeAudience(value: unknown): ProductAudience {
  return value === "MEN" || value === "WOMEN" || value === "UNISEX"
    ? value
    : "UNISEX";
}

function normalizeProductStatus(value: unknown): ProductStatus {
  return value === "DRAFT" ? "DRAFT" : "ACTIVE";
}

function normalizeRequiredText(
  value: unknown,
  fallback: string,
) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : fallback;
}

function isValidImageReference(value: string) {
  if (value.startsWith("/")) {
    return (
      !value.startsWith("//") &&
      /^\/[A-Za-z0-9/_~.%+-]+(?:\?[A-Za-z0-9=&%+_.:-]*)?$/.test(value)
    );
  }

  try {
    const url = new URL(value);

    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function isValidCloudinaryPublicId(publicId: string) {
  return (
    publicId.length <= 255 &&
    !publicId.includes("://") &&
    !publicId.startsWith("/") &&
    /^[A-Za-z0-9_./-]+$/.test(publicId)
  );
}

export function normalizeProductBody(body: ProductBody) {
  const name =
    typeof body.name === "string" ? body.name.trim() : "";
  const slugSource =
    typeof body.slug === "string" && body.slug.trim()
      ? body.slug
      : name;
  const slug = slugifyProductValue(slugSource);
  const skuSource =
    typeof body.sku === "string" && body.sku.trim()
      ? body.sku
      : buildSkuFromSlug(slug);
  const providedImages = parseStringList(body.images);
  const providedPrimaryImage =
    typeof body.image === "string" && body.image.trim()
      ? body.image.trim()
      : "";
  const explicitImages = uniqueList(
    [providedPrimaryImage, ...providedImages].filter(Boolean),
  );
  const primaryImage =
    providedPrimaryImage || explicitImages[0] || FALLBACK_PRODUCT_IMAGE;
  const galleryImages =
    explicitImages.length > 0
      ? uniqueList([primaryImage, ...explicitImages])
      : [primaryImage];
  const price = toFiniteNumber(body.price);
  const originalPrice =
    body.originalPrice === null ||
    body.originalPrice === undefined ||
    body.originalPrice === ""
      ? null
      : toFiniteNumber(body.originalPrice);
  const stock = toFiniteNumber(body.stock);
  const lowStockThreshold = toFiniteNumber(body.lowStockThreshold);

  return {
    hasExplicitImage: explicitImages.length > 0,
    data: {
      slug,
      sku: normalizeSku(skuSource),
      name,
      category:
        typeof body.category === "string"
          ? body.category.trim()
          : "",
      audience: normalizeAudience(body.audience),
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
      price,
      originalPrice,
      image: primaryImage,
      images: galleryImages,
      imagePublicIds: uniqueList(parseStringList(body.imagePublicIds)),
      colors: uniqueList(parseStringList(body.colors)),
      material: normalizeRequiredText(body.material, "Cotton blend"),
      fit: normalizeRequiredText(body.fit, "Regular fit"),
      washCare: normalizeRequiredText(
        body.washCare,
        "Machine wash cold inside out. Do not bleach.",
      ),
      sizes: uniqueList(parseStringList(body.sizes)),
      stock: Number.isFinite(stock)
        ? Math.max(0, Math.floor(stock))
        : 0,
      lowStockThreshold: Number.isFinite(lowStockThreshold)
        ? Math.max(0, Math.floor(lowStockThreshold))
        : 5,
      featured: body.featured === true,
      productStatus: normalizeProductStatus(body.productStatus),
    },
  };
}

export function validateProductInput(
  product: ReturnType<typeof normalizeProductBody>,
) {
  const { data } = product;

  if (!data.slug || data.slug.length > 90) {
    return "Enter a valid product slug or name.";
  }

  if (!data.sku || data.sku.length < 3 || data.sku.length > 64) {
    return "Enter a SKU between 3 and 64 characters.";
  }

  if (data.name.length < 2 || data.name.length > 120) {
    return "Enter a product name between 2 and 120 characters.";
  }

  if (data.category.length < 2 || data.category.length > 80) {
    return "Enter a category between 2 and 80 characters.";
  }

  if (data.collection && data.collection.length > 80) {
    return "Collection must be 80 characters or fewer.";
  }

  if (data.colors.length === 0 || data.colors.length > 12) {
    return "Add 1 to 12 product colors.";
  }

  if (data.colors.some((color) => color.length > 32)) {
    return "Each color must be 32 characters or fewer.";
  }

  if (data.material.length < 2 || data.material.length > 120) {
    return "Enter material between 2 and 120 characters.";
  }

  if (data.fit.length < 2 || data.fit.length > 120) {
    return "Enter fit between 2 and 120 characters.";
  }

  if (data.washCare.length < 5 || data.washCare.length > 300) {
    return "Enter wash care between 5 and 300 characters.";
  }

  if (data.statement.length < 5 || data.statement.length > 180) {
    return "Enter a product statement between 5 and 180 characters.";
  }

  if (data.description.length < 10 || data.description.length > 2000) {
    return "Enter a product description between 10 and 2000 characters.";
  }

  if (!Number.isFinite(data.price) || data.price <= 0) {
    return "Enter a valid product price.";
  }

  if (data.price > 500000) {
    return "Product price is higher than the allowed catalogue limit.";
  }

  if (
    data.originalPrice !== null &&
    (!Number.isFinite(data.originalPrice) ||
      data.originalPrice < data.price)
  ) {
    return "Original price must be empty or greater than or equal to price.";
  }

  if (!product.hasExplicitImage) {
    return "Add at least one product image.";
  }

  if (data.images.length > MAX_GALLERY_IMAGES) {
    return `Add no more than ${MAX_GALLERY_IMAGES} gallery images.`;
  }

  if (!data.image || !isValidImageReference(data.image)) {
    return "Enter a valid primary image URL or site image path.";
  }

  if (data.images.some((image) => !isValidImageReference(image))) {
    return "Every gallery image must be a valid URL or site image path.";
  }

  if (data.imagePublicIds.length > data.images.length) {
    return "Cloudinary public IDs cannot outnumber gallery images.";
  }

  if (
    data.imagePublicIds.some(
      (publicId) => !isValidCloudinaryPublicId(publicId),
    )
  ) {
    return "Cloudinary public IDs must be stored as public IDs, not URLs.";
  }

  if (data.sizes.length === 0 || data.sizes.length > MAX_PRODUCT_SIZES) {
    return `Add 1 to ${MAX_PRODUCT_SIZES} product sizes.`;
  }

  if (data.sizes.some((size) => size.length > 24)) {
    return "Each product size must be 24 characters or fewer.";
  }

  if (data.stock > 100000) {
    return "Stock is higher than the allowed catalogue limit.";
  }

  if (data.lowStockThreshold > 10000) {
    return "Low-stock threshold is higher than the allowed catalogue limit.";
  }

  return null;
}
