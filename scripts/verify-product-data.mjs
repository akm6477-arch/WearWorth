import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const REQUIRED_AUDIENCES = new Set(["MEN", "WOMEN", "UNISEX"]);
const REQUIRED_PRODUCT_STATUSES = new Set(["ACTIVE", "DRAFT"]);

function readString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function hasText(value) {
  return readString(value).length > 0;
}

function hasStringArray(value) {
  return (
    Array.isArray(value) &&
    value.some((item) => typeof item === "string" && item.trim())
  );
}

function hasNonEmptyImage(value) {
  return (
    hasText(value) ||
    (Array.isArray(value) &&
      value.some((item) => typeof item === "string" && item.trim()))
  );
}

function countDuplicates(values) {
  const counts = new Map();

  values
    .filter(Boolean)
    .forEach((value) => {
      counts.set(value, (counts.get(value) || 0) + 1);
    });

  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([value, count]) => ({ value, count }));
}

async function main() {
  const rawProducts = await prisma.product.findRaw({
    options: {
      sort: {
        name: 1,
      },
    },
  });
  const products = Array.isArray(rawProducts) ? rawProducts : [];
  const slugs = products.map((product) => readString(product.slug));
  const skus = products.map((product) => readString(product.sku));

  const summary = {
    products: products.length,
    missingSku: 0,
    missingSlug: 0,
    duplicateSlugs: countDuplicates(slugs),
    duplicateSkus: countDuplicates(skus),
    missingAudience: 0,
    missingCollection: 0,
    missingColors: 0,
    missingMaterial: 0,
    missingFit: 0,
    missingWashCare: 0,
    missingProductStatus: 0,
    missingLowStockThreshold: 0,
    missingCreatedAt: 0,
    missingUpdatedAt: 0,
    missingImagePublicIds: 0,
    invalidPrices: 0,
    negativeStock: 0,
    missingImages: 0,
  };

  products.forEach((product) => {
    if (!hasText(product.sku)) summary.missingSku += 1;
    if (!hasText(product.slug)) summary.missingSlug += 1;
    if (!REQUIRED_AUDIENCES.has(product.audience)) {
      summary.missingAudience += 1;
    }
    if (!hasText(product.collection)) summary.missingCollection += 1;
    if (!hasStringArray(product.colors)) summary.missingColors += 1;
    if (!hasText(product.material)) summary.missingMaterial += 1;
    if (!hasText(product.fit)) summary.missingFit += 1;
    if (!hasText(product.washCare)) summary.missingWashCare += 1;
    if (!REQUIRED_PRODUCT_STATUSES.has(product.productStatus)) {
      summary.missingProductStatus += 1;
    }
    if (typeof product.lowStockThreshold !== "number") {
      summary.missingLowStockThreshold += 1;
    }
    if (typeof product.price !== "number" || product.price <= 0) {
      summary.invalidPrices += 1;
    }
    if (typeof product.stock !== "number" || product.stock < 0) {
      summary.negativeStock += 1;
    }
    if (!hasNonEmptyImage(product.image) && !hasNonEmptyImage(product.images)) {
      summary.missingImages += 1;
    }
    if (!product.createdAt) summary.missingCreatedAt += 1;
    if (!product.updatedAt) summary.missingUpdatedAt += 1;
    if (!Array.isArray(product.imagePublicIds)) {
      summary.missingImagePublicIds += 1;
    }
  });

  console.log(JSON.stringify(summary, null, 2));

  const hasFailures =
    summary.missingSku > 0 ||
    summary.missingSlug > 0 ||
    summary.duplicateSlugs.length > 0 ||
    summary.duplicateSkus.length > 0 ||
    summary.missingAudience > 0 ||
    summary.missingCollection > 0 ||
    summary.missingColors > 0 ||
    summary.missingMaterial > 0 ||
    summary.missingFit > 0 ||
    summary.missingWashCare > 0 ||
    summary.missingProductStatus > 0 ||
    summary.missingLowStockThreshold > 0 ||
    summary.missingCreatedAt > 0 ||
    summary.missingUpdatedAt > 0 ||
    summary.missingImagePublicIds > 0 ||
    summary.invalidPrices > 0 ||
    summary.negativeStock > 0 ||
    summary.missingImages > 0;

  if (hasFailures) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
