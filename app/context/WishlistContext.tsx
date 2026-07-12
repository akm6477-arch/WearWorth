"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { CatalogProduct } from "@/lib/catalog-types";

const WISHLIST_STORAGE_KEY = "wearworth-wishlist";

interface WishlistContextValue {
  wishlistSlugs: string[];
  wishlistCount: number;
  isInWishlist: (product: CatalogProduct | string) => boolean;
  addToWishlist: (product: CatalogProduct | string) => void;
  removeFromWishlist: (product: CatalogProduct | string) => void;
  toggleWishlist: (product: CatalogProduct | string) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(
  undefined,
);

function getProductSlug(product: CatalogProduct | string) {
  return typeof product === "string" ? product : product.slug;
}

function readStoredWishlist(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedWishlist = window.localStorage.getItem(
      WISHLIST_STORAGE_KEY,
    );

    if (!storedWishlist) {
      return [];
    }

    const parsedWishlist: unknown = JSON.parse(storedWishlist);

    if (!Array.isArray(parsedWishlist)) {
      return [];
    }

    return parsedWishlist.filter(
      (item): item is string => typeof item === "string",
    );
  } catch {
    return [];
  }
}

export function WishlistProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [wishlistSlugs, setWishlistSlugs] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setWishlistSlugs(readStoredWishlist());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    try {
      window.localStorage.setItem(
        WISHLIST_STORAGE_KEY,
        JSON.stringify(wishlistSlugs),
      );
    } catch {
      // The website still works if browser storage is unavailable.
    }
  }, [wishlistSlugs, hydrated]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== WISHLIST_STORAGE_KEY) {
        return;
      }

      setWishlistSlugs(readStoredWishlist());
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const isInWishlist = useCallback(
    (product: CatalogProduct | string) => {
      const slug = getProductSlug(product);

      return wishlistSlugs.includes(slug);
    },
    [wishlistSlugs],
  );

  const addToWishlist = useCallback(
    (product: CatalogProduct | string) => {
      const slug = getProductSlug(product);

      setWishlistSlugs((currentWishlist) => {
        if (currentWishlist.includes(slug)) {
          return currentWishlist;
        }

        return [...currentWishlist, slug];
      });
    },
    [],
  );

  const removeFromWishlist = useCallback(
    (product: CatalogProduct | string) => {
      const slug = getProductSlug(product);

      setWishlistSlugs((currentWishlist) =>
        currentWishlist.filter((item) => item !== slug),
      );
    },
    [],
  );

  const toggleWishlist = useCallback(
    (product: CatalogProduct | string) => {
      const slug = getProductSlug(product);

      setWishlistSlugs((currentWishlist) =>
        currentWishlist.includes(slug)
          ? currentWishlist.filter((item) => item !== slug)
          : [...currentWishlist, slug],
      );
    },
    [],
  );

  const clearWishlist = useCallback(() => {
    setWishlistSlugs([]);
  }, []);

  const contextValue = useMemo<WishlistContextValue>(
    () => ({
      wishlistSlugs,
      wishlistCount: wishlistSlugs.length,
      isInWishlist,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      clearWishlist,
    }),
    [
      wishlistSlugs,
      isInWishlist,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      clearWishlist,
    ],
  );

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error(
      "useWishlist must be used inside WishlistProvider",
    );
  }

  return context;
}
