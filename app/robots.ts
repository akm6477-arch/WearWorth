import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api",
        "/addresses",
        "/cart",
        "/checkout",
        "/orders",
        "/profile",
        "/wishlist",
      ],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
