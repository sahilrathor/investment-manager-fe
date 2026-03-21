import { createGenericStore } from './createGenericStore';

export interface User {
  id: string;
  email: string;
  name: string;
  telegramChatId?: string | null;
  createdAt: string;
}

export interface AuthData {
  user: User | null;
  isAuthenticated: boolean;
}

export const useAuthStore = createGenericStore<AuthData>(
  { user: null, isAuthenticated: false },
  true,
  'auth-store'
);
