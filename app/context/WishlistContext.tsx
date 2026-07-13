"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAuth } from "@/app/context/AuthContext";
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
  const { user, loading: authLoading } = useAuth();
  const [wishlistSlugs, setWishlistSlugs] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const mergedAccountUserId = useRef<string | null>(null);
  const syncingAccountWishlist = useRef(false);
  const lastSavedAccountSignature = useRef("");

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

  const wishlistSignature = useMemo(
    () => [...wishlistSlugs].sort().join("|"),
    [wishlistSlugs],
  );

  useEffect(() => {
    if (!hydrated || authLoading) {
      return;
    }

    if (!user) {
      if (mergedAccountUserId.current) {
        mergedAccountUserId.current = null;
        lastSavedAccountSignature.current = "";
        setWishlistSlugs([]);
      }

      return;
    }

    if (
      mergedAccountUserId.current === user.id ||
      syncingAccountWishlist.current
    ) {
      return;
    }

    let cancelled = false;
    syncingAccountWishlist.current = true;

    const mergeAccountWishlist = async () => {
      try {
        const response = await fetch("/api/wishlist", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            slugs: wishlistSlugs,
          }),
        });
        const data = (await response.json()) as {
          slugs?: string[];
        };

        if (!cancelled && response.ok) {
          const nextSlugs = data.slugs || [];
          setWishlistSlugs(nextSlugs);
          mergedAccountUserId.current = user.id;
          lastSavedAccountSignature.current = [...nextSlugs]
            .sort()
            .join("|");
        }
      } catch {
        // Keep the local wishlist available if account sync is unavailable.
      } finally {
        syncingAccountWishlist.current = false;
      }
    };

    void mergeAccountWishlist();

    return () => {
      cancelled = true;
    };
  }, [authLoading, hydrated, user, wishlistSlugs]);

  useEffect(() => {
    if (
      !hydrated ||
      authLoading ||
      !user ||
      mergedAccountUserId.current !== user.id ||
      syncingAccountWishlist.current ||
      lastSavedAccountSignature.current === wishlistSignature
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const saveAccountWishlist = async () => {
        try {
          const response = await fetch("/api/wishlist", {
            method: "PUT",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              slugs: wishlistSlugs,
            }),
          });

          if (response.ok) {
            lastSavedAccountSignature.current = wishlistSignature;
          }
        } catch {
          // The browser wishlist remains usable if account sync fails.
        }
      };

      void saveAccountWishlist();
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    authLoading,
    hydrated,
    user,
    wishlistSignature,
    wishlistSlugs,
  ]);

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
