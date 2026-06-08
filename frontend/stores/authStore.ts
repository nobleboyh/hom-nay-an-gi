import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { User } from '../types/user';

const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';

export type AuthState = 'guest' | 'authenticated' | 'loading';

export interface AuthStore {
  authState: AuthState;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  performTokenRefresh: () => Promise<void>;
}

async function loadSecureStore(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
}> {
  try {
    const [accessToken, refreshToken, userJson] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.getItemAsync(USER_KEY),
    ]);
    return {
      accessToken,
      refreshToken,
      user: userJson ? (JSON.parse(userJson) as User) : null,
    };
  } catch {
    return { accessToken: null, refreshToken: null, user: null };
  }
}

async function saveSecureStore(accessToken: string, refreshToken: string, user: User) {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
  ]);
}

async function clearSecureStore() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ]).catch(() => {});
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  authState: 'loading',
  user: null,
  accessToken: null,
  refreshToken: null,

  initialize: async () => {
    const stored = await loadSecureStore();
    if (stored.accessToken && stored.user) {
      set({
        authState: 'authenticated',
        user: stored.user,
        accessToken: stored.accessToken,
        refreshToken: stored.refreshToken,
      });
    } else {
      set({ authState: 'guest' });
    }
  },

  login: async (_email: string, _password: string) => {
    console.log('[authStore] stub: login', { email: _email });
    const stubUser: User = { id: 'stub-user-1', displayName: 'Stub User' };
    const stubAccessToken = 'stub-access-token';
    const stubRefreshToken = 'stub-refresh-token';
    await saveSecureStore(stubAccessToken, stubRefreshToken, stubUser);
    set({
      authState: 'authenticated',
      user: stubUser,
      accessToken: stubAccessToken,
      refreshToken: stubRefreshToken,
    });
  },

  loginWithGoogle: async () => {
    console.log('[authStore] stub: loginWithGoogle');
    const stubUser: User = { id: 'stub-google-user', displayName: 'Google User' };
    const stubAccessToken = 'stub-google-access-token';
    const stubRefreshToken = 'stub-google-refresh-token';
    await saveSecureStore(stubAccessToken, stubRefreshToken, stubUser);
    set({
      authState: 'authenticated',
      user: stubUser,
      accessToken: stubAccessToken,
      refreshToken: stubRefreshToken,
    });
  },

  logout: async () => {
    console.log('[authStore] stub: logout');
    await clearSecureStore();
    set({
      authState: 'guest',
      user: null,
      accessToken: null,
      refreshToken: null,
    });
  },

  performTokenRefresh: async () => {
    console.warn('[authStore] stub: performTokenRefresh — real token refresh is deferred to Epic 4 (auth module)');
    const current = get();
    if (!current.refreshToken) {
      await current.logout();
      return;
    }
    // Stub: keep existing tokens, no real refresh
  },
}));
