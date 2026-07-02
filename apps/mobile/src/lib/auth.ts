import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../stores';
import { apiRequest } from '../api/client';
import type { LoginResponse } from '@shopcount/types';

const TOKEN_KEY = 'shopcount_access_token';
const REFRESH_KEY = 'shopcount_refresh_token';
const USER_KEY = 'shopcount_user';

export async function loadStoredAuth() {
  try {
    const [accessToken, refreshToken, userJson] = await Promise.all([
      SecureStore.getItemAsync(TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
      SecureStore.getItemAsync(USER_KEY),
    ]);

    if (accessToken && refreshToken && userJson) {
      useAuthStore.getState().setAuth(JSON.parse(userJson), accessToken, refreshToken);
    }
  } catch {
    // No stored auth
  }
}

export async function persistAuth(data: LoginResponse) {
  await Promise.all([
    SecureStore.setItemAsync(TOKEN_KEY, data.tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_KEY, data.tokens.refreshToken),
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user)),
  ]);
  useAuthStore.getState().setAuth(data.user, data.tokens.accessToken, data.tokens.refreshToken);
}

export async function clearAuth() {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ]);
  useAuthStore.getState().logout();
}

export async function login(email: string, password: string) {
  const deviceId = useAuthStore.getState().deviceId;
  const data = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password, deviceId },
  });
  await persistAuth(data);
  return data;
}

export async function refreshTokens() {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) throw new Error('No refresh token');

  const data = await apiRequest<LoginResponse>('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
  });
  await persistAuth(data);
  return data;
}
