import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ViewedProduct {
  id: string; // Product slug
  name: string;
  price: number;
  image: string;
  category: string;
}

interface RecentlyViewedState {
  items: ViewedProduct[];
  addItem: (item: ViewedProduct) => void;
  clear: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          // Remove if already exists to move it to the front
          const filtered = state.items.filter((i) => i.id !== item.id);
          // Add to front and keep only the last 4 items
          return { items: [item, ...filtered].slice(0, 4) };
        }),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'rootgrain-recently-viewed',
    }
  )
);
