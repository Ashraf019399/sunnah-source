import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/commerce.types";

export interface WishlistState {
  items: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
  // Aliases for compatibility
  addItem?: (product: Product) => void;
  removeItem?: (productId: string) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggleWishlist: (product: Product) => {
        if (!product || !product.id) return;
        const current = get().items;
        const exists = current.some((item) => item.id === product.id);
        if (exists) {
          set({ items: current.filter((item) => item.id !== product.id) });
        } else {
          set({ items: [...current, product] });
        }
      },
      isInWishlist: (productId: string) => {
        if (!productId) return false;
        return get().items.some((item) => item.id === productId);
      },
      removeFromWishlist: (productId: string) => {
        if (!productId) return;
        set({ items: get().items.filter((item) => item.id !== productId) });
      },
      clearWishlist: () => {
        set({ items: [] });
      },
      addItem: (product: Product) => {
        if (!product || !product.id) return;
        const current = get().items;
        if (!current.some((item) => item.id === product.id)) {
          set({ items: [...current, product] });
        }
      },
      removeItem: (productId: string) => {
        get().removeFromWishlist(productId);
      },
    }),
    {
      name: "sunnah_wishlist",
    }
  )
);
