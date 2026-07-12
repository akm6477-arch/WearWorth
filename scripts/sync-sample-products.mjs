import generatedProducts from "../app/data/generated-products.json" with { type: "json" };
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  let updated = 0;
  let created = 0;

  for (const product of generatedProducts) {
    const existing = await prisma.product.findUnique({
      where: { slug: product.slug },
      select: { id: true },
    });

    if (existing) {
      await prisma.product.update({
        where: { slug: product.slug },
        data: product,
      });
      updated += 1;
    } else {
      await prisma.product.create({
        data: product,
      });
      created += 1;
    }
  }

  const total = await prisma.product.count();

  console.log(
    JSON.stringify({
      created,
      updated,
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
