import type { CatalogProduct } from "@/lib/catalog-types";

export type Product = CatalogProduct;

export const products: Product[] = [
  {
    id: "1",
    slug: "built-from-broken-tee",
    name: "Built From Broken Tee",
    category: "Oversized T-Shirts",
    collection: "Still Becoming",
    statement: "What tried to break you became your shape.",
    description:
      "Heavyweight oversized cotton tee designed as wearable self-belief.",
    price: 999,
    originalPrice: 1399,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=85",
    ],
    imagePublicIds: [],
    sizes: ["S", "M", "L", "XL", "XXL"],
    stock: 24,
    featured: true,
  },
  {
    id: "2",
    slug: "dreams-dont-sleep-hoodie",
    name: "Dreams Don't Sleep Hoodie",
    category: "Hoodies",
    collection: "Dreams Don't Sleep",
    statement: "Rest your body. Never retire your dream.",
    description:
      "Soft brushed hoodie for builders, believers and late-night dreamers.",
    price: 1899,
    originalPrice: 2499,
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=85",
    ],
    imagePublicIds: [],
    sizes: ["S", "M", "L", "XL"],
    stock: 18,
    featured: true,
  },
  {
    id: "3",
    slug: "own-your-story-shirt",
    name: "Own Your Story Shirt",
    category: "Shirts",
    collection: "Own Your Story",
    statement: "You are not a copy. Dress like the original.",
    description:
      "Relaxed shirt with a clean silhouette and an identity-first message.",
    price: 1499,
    originalPrice: 1999,
    image:
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=85",
    ],
    imagePublicIds: [],
    sizes: ["S", "M", "L", "XL", "XXL"],
    stock: 16,
    featured: true,
  },
  {
    id: "4",
    slug: "quiet-power-joggers",
    name: "Quiet Power Joggers",
    category: "Bottomwear",
    collection: "Quiet Power",
    statement: "Not every strength needs an announcement.",
    description:
      "Everyday joggers combining movement, comfort and understated confidence.",
    price: 1299,
    originalPrice: 1699,
    image:
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=1200&q=85",
    ],
    imagePublicIds: [],
    sizes: ["S", "M", "L", "XL"],
    stock: 20,
    featured: true,
  },
];
