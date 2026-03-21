import { createGenericStore } from './createGenericStore';

export interface UIData {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
}

export const useUIStore = createGenericStore<UIData>(
  { theme: 'light', sidebarOpen: true },
  true,
  'ui-store'
);
