import { create } from 'zustand';
import type { AuthUser } from '@shopcount/types';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  deviceId: string;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,
  deviceId: `device-${Date.now()}`,
  setAuth: (user, accessToken, refreshToken) =>
    set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false }),
  setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () =>
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}));

interface CountState {
  activeSessionId: string | null;
  activeLocationId: string | null;
  scanIncrementMode: boolean;
  setActiveSession: (id: string | null) => void;
  setActiveLocation: (id: string | null) => void;
  toggleScanIncrement: () => void;
}

export const useCountStore = create<CountState>((set) => ({
  activeSessionId: null,
  activeLocationId: null,
  scanIncrementMode: true,
  setActiveSession: (activeSessionId) => set({ activeSessionId }),
  setActiveLocation: (activeLocationId) => set({ activeLocationId }),
  toggleScanIncrement: () => set((s) => ({ scanIncrementMode: !s.scanIncrementMode })),
}));

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: string | null;
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setPendingCount: (count: number) => void;
  setLastSync: (at: string) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncAt: null,
  setOnline: (isOnline) => set({ isOnline }),
  setSyncing: (isSyncing) => set({ isSyncing }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setLastSync: (lastSyncAt) => set({ lastSyncAt }),
}));
