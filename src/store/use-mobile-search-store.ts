import { create } from "zustand";

interface MobileSearchState {
  isOpen: boolean;
  initialQuery: string;
  openSearch: (query?: string) => void;
  closeSearch: () => void;
  toggleSearch: () => void;
}

export const useMobileSearchStore = create<MobileSearchState>((set) => ({
  isOpen: false,
  initialQuery: "",
  openSearch: (query = "") => set({ isOpen: true, initialQuery: query }),
  closeSearch: () => set({ isOpen: false, initialQuery: "" }),
  toggleSearch: () => set((state) => ({ isOpen: !state.isOpen })),
}));

export default useMobileSearchStore;

