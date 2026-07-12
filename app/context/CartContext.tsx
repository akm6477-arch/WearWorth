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

export interface CartItem {
  product: CatalogProduct;
  quantity: number;
  size: string;
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
  ) => void;

  increaseQuantity: (
    productId: string,
    size: string,
  ) => void;

  decreaseQuantity: (
    productId: string,
    size: string,
  ) => void;

  updateQuantity: (
    productId: string,
    size: string,
    quantity: number,
  ) => void;

  removeFromCart: (
    productId: string,
    size: string,
  ) => void;

  clearCart: () => void;
}

const CART_STORAGE_KEY = "wearworth-cart";

const CartContext = createContext<CartContextType | null>(
  null,
);

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

    return parsedCart.filter((item): item is CartItem => {
      if (
        typeof item !== "object" ||
        item === null
      ) {
        return false;
      }

      const possibleItem = item as Partial<CartItem>;

      return (
        typeof possibleItem.product === "object" &&
        possibleItem.product !== null &&
        typeof possibleItem.quantity === "number" &&
        possibleItem.quantity > 0 &&
        typeof possibleItem.size === "string"
      );
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
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

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

  const addToCart = useCallback(
    (
      product: CatalogProduct,
      size = product.sizes[0] ?? "",
      quantity = 1,
    ) => {
      const safeQuantity = Math.max(
        1,
        Math.floor(quantity),
      );

      setItems((currentItems) => {
        const existingItemIndex =
          currentItems.findIndex(
            (item) =>
              item.product.id === product.id &&
              item.size === size,
          );

        if (existingItemIndex === -1) {
          return [
            ...currentItems,
            {
              product,
              size,
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
    (productId: string, size: string) => {
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.product.id === productId &&
          item.size === size
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
    (productId: string, size: string) => {
      setItems((currentItems) =>
        currentItems
          .map((item) =>
            item.product.id === productId &&
            item.size === size
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
                item.size === size
              ),
          );
        }

        return currentItems.map((item) =>
          item.product.id === productId &&
          item.size === size
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
    (productId: string, size: string) => {
      setItems((currentItems) =>
        currentItems.filter(
          (item) =>
            !(
              item.product.id === productId &&
              item.size === size
            ),
        ),
      );
    },
    [],
  );

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
