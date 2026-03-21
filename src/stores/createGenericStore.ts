import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GenericStore<T> {
  data: T;
  setData: (value: T) => void;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  reset: () => void;
}

export function createGenericStore<T>(
  initialValue: T,
  persistStore: boolean = false,
  persistKey: string = 'generic-store'
) {
  const baseConfig = (set: any): GenericStore<T> => ({
    data: initialValue,
    setData: (value: T) => set({ data: value }),
    isLoading: false,
    setIsLoading: (value: boolean) => set({ isLoading: value }),
    reset: () => set({ data: initialValue }),
  });

  return persistStore
    ? create<GenericStore<T>>()(
        persist(baseConfig, {
          name: persistKey,
        })
      )
    : create<GenericStore<T>>(baseConfig);
}
