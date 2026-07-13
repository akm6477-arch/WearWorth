import type { MetadataRoute } from "next";

import { getCatalogProducts } from "@/lib/catalog";
import { getSiteUrl } from "@/lib/site-url";

const staticRoutes = [
  { path: "/", priority: 1 },
  { path: "/products", priority: 0.95 },
  { path: "/collections", priority: 0.8 },
  { path: "/about", priority: 0.75 },
  { path: "/shipping", priority: 0.45 },
  { path: "/returns", priority: 0.45 },
  { path: "/size-guide", priority: 0.45 },
  { path: "/faqs", priority: 0.45 },
  { path: "/contact", priority: 0.4 },
  { path: "/privacy", priority: 0.25 },
  { path: "/terms", priority: 0.25 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();
  const { products } = await getCatalogProducts({
    sort: "newest",
  });

  const routeEntries = staticRoutes.map((route) => ({
    url: new URL(route.path, siteUrl).toString(),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: route.priority,
  }));

  const productEntries = products.map((product) => ({
    url: new URL(`/products/${product.slug}`, siteUrl).toString(),
    lastModified: new Date(product.updatedAt),
    changeFrequency: "weekly" as const,
    priority: product.featured ? 0.9 : 0.72,
  }));

  return [...routeEntries, ...productEntries];
}
