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

export interface CartItem {
  product: CatalogProduct;
  quantity: number;
  size: string;
  color: string;
}

interface CartContextType {
  items: CartItem[];
  count: number;
  total: number;
  hydrated: boolean;

  addToCart: (
    product: CatalogProduct,
    size?: string,
    quantity?: number,
    color?: string,
  ) => void;

  increaseQuantity: (
    productId: string,
    size: string,
    color?: string,
  ) => void;

  decreaseQuantity: (
    productId: string,
    size: string,
    color?: string,
  ) => void;

  updateQuantity: (
    productId: string,
    size: string,
    quantity: number,
    color?: string,
  ) => void;

  removeFromCart: (
    productId: string,
    size: string,
    color?: string,
  ) => void;

  replaceCart: (items: CartItem[]) => void;

  clearCart: () => void;
}

const CART_STORAGE_KEY = "wearworth-cart";

const CartContext = createContext<CartContextType | null>(
  null,
);

function resolveCartColor(
  product: CatalogProduct,
  color?: string,
) {
  const selectedColor =
    typeof color === "string" ? color.trim() : "";

  return selectedColor || product.colors[0] || "";
}

function buildCartSignature(items: CartItem[]) {
  return items
    .map(
      (item) =>
        `${item.product.slug}:${item.size}:${item.color}:${item.quantity}`,
    )
    .sort()
    .join("|");
}

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const savedCart = window.localStorage.getItem(
      CART_STORAGE_KEY,
    );

    if (!savedCart) {
      return [];
    }

    const parsedCart: unknown = JSON.parse(savedCart);

    if (!Array.isArray(parsedCart)) {
      return [];
    }

    return parsedCart.flatMap((item): CartItem[] => {
      if (
        typeof item !== "object" ||
        item === null
      ) {
        return [];
      }

      const possibleItem = item as Partial<CartItem>;

      if (
        typeof possibleItem.product !== "object" ||
        possibleItem.product === null ||
        typeof possibleItem.quantity !== "number" ||
        possibleItem.quantity <= 0 ||
        typeof possibleItem.size !== "string"
      ) {
        return [];
      }

      const product = possibleItem.product as CatalogProduct;

      return [
        {
          product,
          quantity: possibleItem.quantity,
          size: possibleItem.size,
          color: resolveCartColor(
            product,
            possibleItem.color,
          ),
        },
      ];
    });
  } catch {
    return [];
  }
}

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const mergedAccountUserId = useRef<string | null>(null);
  const syncingAccountCart = useRef(false);
  const lastSavedAccountSignature = useRef("");

  useEffect(() => {
    setItems(readStoredCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    try {
      window.localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(items),
      );
    } catch {
      // The cart still works during this session
      // if browser storage is unavailable.
    }
  }, [items, hydrated]);

  useEffect(() => {
    if (!hydrated || authLoading) {
      return;
    }

    if (!user) {
      if (mergedAccountUserId.current) {
        mergedAccountUserId.current = null;
        lastSavedAccountSignature.current = "";
        setItems([]);
      }

      return;
    }

    if (
      mergedAccountUserId.current === user.id ||
      syncingAccountCart.current
    ) {
      return;
    }

    let cancelled = false;
    syncingAccountCart.current = true;

    const mergeAccountCart = async () => {
      try {
        const response = await fetch("/api/cart", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: items.map((item) => ({
              productId: item.product.id,
              slug: item.product.slug,
              size: item.size,
              color: item.color,
              quantity: item.quantity,
            })),
          }),
        });
        const data = (await response.json()) as {
          items?: CartItem[];
        };

        if (!cancelled && response.ok) {
          const nextItems = data.items || [];
          setItems(nextItems);
          mergedAccountUserId.current = user.id;
          lastSavedAccountSignature.current =
            buildCartSignature(nextItems);
        }
      } catch {
        // Keep the local cart available if account sync is unavailable.
      } finally {
        syncingAccountCart.current = false;
      }
    };

    void mergeAccountCart();

    return () => {
      cancelled = true;
    };
  }, [authLoading, hydrated, user, items]);

  const accountCartSignature = useMemo(
    () => buildCartSignature(items),
    [items],
  );

  useEffect(() => {
    if (
      !hydrated ||
      authLoading ||
      !user ||
      mergedAccountUserId.current !== user.id ||
      syncingAccountCart.current ||
      lastSavedAccountSignature.current === accountCartSignature
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const saveAccountCart = async () => {
        try {
          const response = await fetch("/api/cart", {
            method: "PUT",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              items: items.map((item) => ({
                productId: item.product.id,
                slug: item.product.slug,
                size: item.size,
                color: item.color,
                quantity: item.quantity,
              })),
            }),
          });

          if (response.ok) {
            lastSavedAccountSignature.current =
              accountCartSignature;
          }
        } catch {
          // The local cart remains usable if account sync fails.
        }
      };

      void saveAccountCart();
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    accountCartSignature,
    authLoading,
    hydrated,
    items,
    user,
  ]);

  const addToCart = useCallback(
    (
      product: CatalogProduct,
      size = product.sizes[0] ?? "",
      quantity = 1,
      color?: string,
    ) => {
      const safeQuantity = Math.max(
        1,
        Math.floor(quantity),
      );
      const selectedColor = resolveCartColor(product, color);

      setItems((currentItems) => {
        const existingItemIndex =
          currentItems.findIndex(
            (item) =>
              item.product.id === product.id &&
              item.size === size &&
              item.color === selectedColor,
          );

        if (existingItemIndex === -1) {
          return [
            ...currentItems,
            {
              product,
              size,
              color: selectedColor,
              quantity: safeQuantity,
            },
          ];
        }

        return currentItems.map((item, index) =>
          index === existingItemIndex
            ? {
                ...item,
                quantity:
                  item.quantity + safeQuantity,
              }
            : item,
        );
      });
    },
    [],
  );

  const increaseQuantity = useCallback(
    (
      productId: string,
      size: string,
      color = "",
    ) => {
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.product.id === productId &&
          item.size === size &&
          item.color === color
            ? {
                ...item,
                quantity: Math.min(
                  item.quantity + 1,
                  10,
                ),
              }
            : item,
        ),
      );
    },
    [],
  );

  const decreaseQuantity = useCallback(
    (
      productId: string,
      size: string,
      color = "",
    ) => {
      setItems((currentItems) =>
        currentItems
          .map((item) =>
            item.product.id === productId &&
            item.size === size &&
            item.color === color
              ? {
                  ...item,
                  quantity: item.quantity - 1,
                }
              : item,
          )
          .filter((item) => item.quantity > 0),
      );
    },
    [],
  );

  const updateQuantity = useCallback(
    (
      productId: string,
      size: string,
      quantity: number,
      color = "",
    ) => {
      const safeQuantity = Math.max(
        0,
        Math.min(10, Math.floor(quantity)),
      );

      setItems((currentItems) => {
        if (safeQuantity === 0) {
          return currentItems.filter(
            (item) =>
              !(
                item.product.id === productId &&
                item.size === size &&
                item.color === color
              ),
          );
        }

        return currentItems.map((item) =>
          item.product.id === productId &&
          item.size === size &&
          item.color === color
            ? {
                ...item,
                quantity: safeQuantity,
              }
            : item,
        );
      });
    },
    [],
  );

  const removeFromCart = useCallback(
    (
      productId: string,
      size: string,
      color = "",
    ) => {
      setItems((currentItems) =>
        currentItems.filter(
          (item) =>
            !(
              item.product.id === productId &&
              item.size === size &&
              item.color === color
            ),
        ),
      );
    },
    [],
  );

  const replaceCart = useCallback((nextItems: CartItem[]) => {
    setItems(nextItems);
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const count = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.quantity,
        0,
      ),
    [items],
  );

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          item.product.price * item.quantity,
        0,
      ),
    [items],
  );

  const value = useMemo<CartContextType>(
    () => ({
      items,
      count,
      total,
      hydrated,
      addToCart,
      increaseQuantity,
      decreaseQuantity,
      updateQuantity,
      removeFromCart,
      replaceCart,
      clearCart,
    }),
    [
      items,
      count,
      total,
      hydrated,
      addToCart,
      increaseQuantity,
      decreaseQuantity,
      updateQuantity,
      removeFromCart,
      replaceCart,
      clearCart,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider",
    );
  }

  return context;
}
