import generatedProductsJson from "@/app/data/generated-products.json";

export interface GeneratedProductInput {
  slug: string;
  name: string;
  category: string;
  collection: string;
  statement: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  images: string[];
  imagePublicIds: string[];
  sizes: string[];
  stock: number;
  featured: boolean;
}

export const generatedProducts =
  generatedProductsJson as GeneratedProductInput[];
