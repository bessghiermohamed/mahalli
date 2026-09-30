"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Product, ProductImage } from "@/types/database";
import { numOrNull, num } from "@/lib/utils";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  slug: string;
  image: string | null;
  stock: number | null;
  qty: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  ready: boolean;
  add: (product: Product & { product_images?: ProductImage[] }, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  has: (productId: string) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

const storageKey = (slug: string) => `mahalli.cart.${slug}`;

export function CartProvider({
  storeSlug,
  children,
}: {
  storeSlug: string;
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Load persisted cart in a microtask (not synchronously in the effect)
    // so hydration completes before client-only state is applied.
    Promise.resolve().then(() => {
      if (cancelled) return;
      try {
        const raw = localStorage.getItem(storageKey(storeSlug));
        if (raw) {
          const parsed = JSON.parse(raw) as CartItem[];
          if (Array.isArray(parsed)) {
            setItems(
              parsed.filter(
                (i) =>
                  i && typeof i.productId === "string" && Number.isFinite(i.qty) && i.qty > 0
              )
            );
          }
        }
      } catch {
        // corrupted cart — start fresh
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [storeSlug]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey(storeSlug), JSON.stringify(items));
    } catch {
      // storage full/unavailable — cart stays in memory
    }
  }, [items, ready, storeSlug]);

  const add = useCallback(
    (product: Product & { product_images?: ProductImage[] }, qty = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        const price = num(product.price);
        const stock = numOrNull(product.stock);
        const image = product.product_images?.[0]?.public_url || null;

        if (existing) {
          const nextQty = stock === null ? existing.qty + qty : Math.min(stock, existing.qty + qty);
          return prev.map((i) =>
            i.productId === product.id ? { ...i, qty: nextQty, price, stock } : i
          );
        }
        const qtyToAdd = stock === null ? qty : Math.min(stock, qty);
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            price,
            slug: product.slug,
            image,
            stock,
            qty: qtyToAdd,
          },
        ];
      });
    },
    []
  );

  const setQty = useCallback((productId: string, qty: number) => {
    setItems((prev) => {
      if (qty <= 0) return prev.filter((i) => i.productId !== productId);
      return prev.map((i) =>
        i.productId === productId
          ? {
              ...i,
              qty: i.stock === null ? Math.min(qty, 99) : Math.min(qty, i.stock, 99),
            }
          : i
      );
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((acc, i) => acc + i.qty, 0);
    const subtotal = items.reduce((acc, i) => acc + i.price * i.qty, 0);
    return {
      items,
      count,
      subtotal,
      ready,
      add,
      setQty,
      remove,
      clear,
      has: (productId: string) => items.some((i) => i.productId === productId),
    };
  }, [items, ready, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
