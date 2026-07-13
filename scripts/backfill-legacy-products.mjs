import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const applyChanges = process.argv.includes("--apply");

const REQUIRED_AUDIENCES = new Set(["MEN", "WOMEN", "UNISEX"]);
const REQUIRED_PRODUCT_STATUSES = new Set(["ACTIVE", "DRAFT"]);

function readId(value) {
  if (
    value &&
    typeof value === "object" &&
    typeof value.$oid === "string"
  ) {
    return value.$oid;
  }

  return typeof value === "string" ? value : "";
}

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

function slugToSku(slug, id, index) {
  const source = slug || id || `product-${index + 1}`;
  const skuBody = source
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `WW-${skuBody || `PRODUCT-${index + 1}`}`;
}

function nextUniqueSku(product, index, usedSkus) {
  const id = readId(product._id);
  const baseSku = slugToSku(readString(product.slug), id, index);
  let candidate = baseSku;
  let suffix = 2;

  while (usedSkus.has(candidate)) {
    candidate = `${baseSku.slice(0, 58)}-${suffix}`;
    suffix += 1;
  }

  usedSkus.add(candidate);

  return candidate;
}

function buildUpdates(product, index, usedSkus) {
  const updates = {};

  if (!hasText(product.sku)) {
    updates.sku = nextUniqueSku(product, index, usedSkus);
  }

  if (!REQUIRED_AUDIENCES.has(product.audience)) {
    updates.audience = "UNISEX";
  }

  if (!hasText(product.collection)) {
    updates.collection = "WearWorth Essentials";
  }

  if (!hasStringArray(product.colors)) {
    updates.colors = ["Black", "White"];
  }

  if (!hasText(product.material)) {
    updates.material = "Cotton blend";
  }

  if (!hasText(product.fit)) {
    updates.fit = "Regular fit";
  }

  if (!hasText(product.washCare)) {
    updates.washCare =
      "Machine wash cold inside out. Do not bleach.";
  }

  if (!REQUIRED_PRODUCT_STATUSES.has(product.productStatus)) {
    updates.productStatus = "ACTIVE";
  }

  if (typeof product.lowStockThreshold !== "number") {
    updates.lowStockThreshold = 5;
  }

  if (!Array.isArray(product.imagePublicIds)) {
    updates.imagePublicIds = [];
  }

  if (!product.createdAt) {
    updates.createdAt = new Date();
  }

  if (!product.updatedAt) {
    updates.updatedAt = new Date();
  }

  return updates;
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
  const usedSkus = new Set(
    products.map((product) => readString(product.sku)).filter(Boolean),
  );
  const plannedUpdates = [];

  products.forEach((product, index) => {
    const id = readId(product._id);
    const updates = buildUpdates(product, index, usedSkus);

    if (id && Object.keys(updates).length > 0) {
      plannedUpdates.push({
        id,
        slug: readString(product.slug),
        fields: Object.keys(updates),
        updates,
      });
    }
  });

  if (!applyChanges) {
    console.log(
      JSON.stringify(
        {
          mode: "dry-run",
          productsScanned: products.length,
          productsNeedingUpdates: plannedUpdates.length,
          plannedUpdates: plannedUpdates.map((update) => ({
            id: update.id,
            slug: update.slug,
            fields: update.fields,
          })),
          nextStep:
            "Run `node scripts/backfill-legacy-products.mjs --apply` to apply these missing-field defaults.",
        },
        null,
        2,
      ),
    );
    return;
  }

  for (const plannedUpdate of plannedUpdates) {
    await prisma.product.update({
      where: {
        id: plannedUpdate.id,
      },
      data: plannedUpdate.updates,
      select: {
        id: true,
      },
    });
  }

  console.log(
    JSON.stringify(
      {
        mode: "apply",
        productsScanned: products.length,
        productsUpdated: plannedUpdates.length,
        updatedFields: plannedUpdates.map((update) => ({
          id: update.id,
          slug: update.slug,
          fields: update.fields,
        })),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
