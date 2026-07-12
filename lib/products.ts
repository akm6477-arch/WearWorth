import { products as staticProducts } from "@/app/data/products";
import { prisma } from "@/lib/prisma";

export interface TrustedProductSnapshot {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  category: string;
  statement: string;
}

export async function getTrustedProductsBySlugs(
  slugs: string[],
): Promise<TrustedProductSnapshot[]> {
  const uniqueSlugs = [...new Set(slugs.filter(Boolean))];

  if (uniqueSlugs.length === 0) {
    return [];
  }

  const dbProducts = await prisma.product.findMany({
    where: {
      slug: {
        in: uniqueSlugs,
      },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      price: true,
      image: true,
      category: true,
      statement: true,
    },
  });

  const dbMap = new Map(
    dbProducts.map((product) => [
      product.slug,
      {
        ...product,
        price: Number(product.price),
      },
    ]),
  );

  return uniqueSlugs
    .map((slug) => {
      const dbProduct = dbMap.get(slug);

      if (dbProduct) {
        return dbProduct;
      }

      const staticProduct = staticProducts.find(
        (product) => product.slug === slug,
      );

      if (!staticProduct) {
        return null;
      }

      return {
        id: staticProduct.id,
        slug: staticProduct.slug,
        name: staticProduct.name,
        price: staticProduct.price,
        image: staticProduct.image,
        category: staticProduct.category,
        statement: staticProduct.statement,
      };
    })
    .filter((product): product is TrustedProductSnapshot => Boolean(product));
}
