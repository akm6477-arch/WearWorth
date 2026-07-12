export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  collection: string | null;
  statement: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  imagePublicIds: string[];
  sizes: string[];
  stock: number;
  featured: boolean;
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
  sort?: ProductSortOption;
  featuredOnly?: boolean;
}
