import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem } from "@/types/commerce.types";
interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}
export const useCartStore = create<CartState>()(
  persist((set, get) => ({
    items: [],
    isDrawerOpen: false,
    addItem: (newItem) => {
      const current = get().items;
      const exist = current.find((i) => i.variantId === newItem.variantId);
      if (exist) {
        set({ items: current.map((i) => i.variantId === newItem.variantId ? { ...i, quantity: Math.min(i.quantity + newItem.quantity, i.maxStock) } : i), isDrawerOpen: true });
      } else {
        set({ items: [...current, newItem], isDrawerOpen: true });
      }
    },
    removeItem: (variantId) => set({ items: get().items.filter((i) => i.variantId !== variantId) }),
    updateQuantity: (variantId, qty) => {
      if (qty <= 0) get().removeItem(variantId);
      else set({ items: get().items.map((i) => i.variantId === variantId ? { ...i, quantity: Math.min(qty, i.maxStock) } : i) });
    },
    clearCart: () => set({ items: [] }),
    openDrawer: () => set({ isDrawerOpen: true }),
    closeDrawer: () => set({ isDrawerOpen: false }),
    getSubtotal: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  }), { name: "sunnah_source_cart" })
);