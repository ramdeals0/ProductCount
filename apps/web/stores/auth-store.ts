'use client';

import { create } from 'zustand';
import { authStorage, type StoredUser } from '@/lib/auth-storage';

interface AuthState {
  user: StoredUser | null;
  token: string | null;
  hydrated: boolean;
  setSession: (token: string, refreshToken: string, user: StoredUser) => void;
  clearSession: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  hydrated: false,
  setSession: (token, refreshToken, user) => {
    authStorage.setSession(token, refreshToken, user);
    set({ user, token, hydrated: true });
  },
  clearSession: () => {
    authStorage.clear();
    set({ user: null, token: null, hydrated: true });
  },
  hydrate: () => {
    set({
      user: authStorage.getUser(),
      token: authStorage.getAccessToken(),
      hydrated: true,
    });
  },
}));
