"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  beatId: string;
  licenseId: string;
  slug: string;
  title: string;
  tier: string;
  licenseName: string;
  price: number;
  coverImage: string | null;
  fileFormat: string | null;
  bpm: number | null;
  musicalKey: string | null;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  open: boolean;
  ready: boolean;
  add: (item: CartItem) => { added: boolean; reason?: string };
  remove: (licenseId: string) => void;
  removeBeat: (beatId: string) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
  has: (licenseId: string) => boolean;
  hasBeat: (beatId: string) => boolean;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "bs_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpenState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The cart lives in localStorage, which doesn't exist during SSR, so it can
    // only be read after mount — this single synchronous set is intentional.
    let restored: CartItem[] = [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) {
          restored = parsed.filter((item) => item && item.licenseId && item.beatId);
        }
      }
    } catch {
      /* ignore corrupted carts */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only restore
    setItems(restored);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full / disabled */
    }
  }, [items, ready]);

  const setOpen = useCallback((next: boolean) => setOpenState(next), []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const add = useCallback((item: CartItem) => {
    let result: { added: boolean; reason?: string } = { added: true };
    setItems((current) => {
      if (current.some((i) => i.licenseId === item.licenseId)) {
        result = { added: false, reason: "That licence is already in your cart." };
        return current;
      }
      // One licence per beat — replacing avoids accidental double licensing.
      const withoutBeat = current.filter((i) => i.beatId !== item.beatId);
      return [...withoutBeat, item];
    });
    setOpenState(true);
    return result;
  }, []);

  const remove = useCallback((licenseId: string) => {
    setItems((current) => current.filter((i) => i.licenseId !== licenseId));
  }, []);

  const removeBeat = useCallback((beatId: string) => {
    setItems((current) => current.filter((i) => i.beatId !== beatId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.length,
      subtotal: items.reduce((sum, i) => sum + i.price, 0),
      open,
      ready,
      add,
      remove,
      removeBeat,
      clear,
      setOpen,
      has: (licenseId: string) => items.some((i) => i.licenseId === licenseId),
      hasBeat: (beatId: string) => items.some((i) => i.beatId === beatId),
    }),
    [items, open, ready, add, remove, removeBeat, clear, setOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
