export type ProductAudience = "MEN" | "WOMEN" | "UNISEX";

export type ProductStatus = "ACTIVE" | "DRAFT";

export interface CatalogProduct {
  id: string;
  slug: string;
  sku: string;
  name: string;
  category: string;
  audience: ProductAudience;
  collection: string | null;
  statement: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  imagePublicIds: string[];
  colors: string[];
  material: string;
  fit: string;
  washCare: string;
  sizes: string[];
  stock: number;
  lowStockThreshold: number;
  featured: boolean;
  productStatus: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export type ProductSortOption =
  | "featured"
  | "price-low"
  | "price-high"
  | "name-az"
  | "name-za"
  | "newest";

export interface ProductQueryOptions {
  search?: string;
  category?: string;
  audience?: ProductAudience | "all";
  sort?: ProductSortOption;
  featuredOnly?: boolean;
  includeDrafts?: boolean;
}
