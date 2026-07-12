import ProductsPageClient from "@/app/products/ProductsPageClient";
import { getCatalogProducts } from "@/lib/catalog";

export default async function ProductsPage() {
  const initialCatalogResult = await getCatalogProducts({
    sort: "featured",
  });
  const allProductsResult = await getCatalogProducts();

  const initialCategories = Array.from(
    new Set(
      allProductsResult.products.map(
        (product) => product.category,
      ),
    ),
  ).sort((firstCategory, secondCategory) =>
    firstCategory.localeCompare(secondCategory),
  );

  return (
    <ProductsPageClient
      initialCategories={initialCategories}
      initialProducts={initialCatalogResult.products}
      initialSource={initialCatalogResult.source}
    />
  );
}
