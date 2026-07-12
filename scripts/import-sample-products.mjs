import generatedProducts from "../app/data/generated-products.json" with { type: "json" };
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.product.findMany({
    select: { slug: true },
  });
  const existingSlugs = new Set(existing.map((item) => item.slug));
  const productsToCreate = generatedProducts.filter(
    (item) => !existingSlugs.has(item.slug),
  );

  if (productsToCreate.length > 0) {
    await prisma.product.createMany({
      data: productsToCreate,
    });
  }

  const total = await prisma.product.count();

  console.log(
    JSON.stringify({
      created: productsToCreate.length,
      skipped: generatedProducts.length - productsToCreate.length,
      total,
    }),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
