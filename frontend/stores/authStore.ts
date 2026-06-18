import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as AuthSession from 'expo-auth-session';
import type { User } from '../types/user';

const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';

export type AuthState = 'guest' | 'authenticated' | 'loading';

export type LoginErrorCode = 'AUTH_INVALID_CREDENTIALS' | 'RATE_LIMIT_EXCEEDED' | 'NETWORK_ERROR' | 'UNKNOWN';

export class LoginError extends Error {
  code: LoginErrorCode;

  constructor(code: LoginErrorCode, message: string) {
    super(message);
    this.name = 'LoginError';
    this.code = code;
    Object.setPrototypeOf(this, LoginError.prototype);
  }
}

export interface AuthStore {
  authState: AuthState;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  performTokenRefresh: () => Promise<void>;
}

function useFallbackStorage(): boolean {
  return Platform.OS === 'web';
}

async function saveSecureStore(accessToken: string, refreshToken: string, user: User) {
  const items = [
    [ACCESS_TOKEN_KEY, accessToken],
    [REFRESH_TOKEN_KEY, refreshToken],
    [USER_KEY, JSON.stringify(user)],
  ] as const;
  if (useFallbackStorage()) {
    await Promise.all(items.map(([k, v]) => AsyncStorage.setItem(k, v)));
    return;
  }
  await Promise.all(items.map(([k, v]) => SecureStore.setItemAsync(k, v)));
}

async function loadSecureStore(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
}> {
  try {
    const items = [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY];
    if (useFallbackStorage()) {
      const [accessToken, refreshToken, userJson] = await Promise.all(
        items.map((k) => AsyncStorage.getItem(k)),
      );
      return {
        accessToken,
        refreshToken,
        user: userJson ? (JSON.parse(userJson) as User) : null,
      };
    }
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

async function clearSecureStore() {
  const keys = [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY];
  if (useFallbackStorage()) {
    await AsyncStorage.multiRemove(keys);
    return;
  }
  await Promise.all(keys.map((k) => SecureStore.deleteItemAsync(k))).catch(() => {});
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
      const refreshToken = stored.refreshToken;
      if (refreshToken) {
        try {
          const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}/api/v1/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          if (response.ok) {
            const body = await response.json() as { data?: { accessToken: string; refreshToken?: string } };
            if (body?.data?.accessToken) {
              const newAccessToken = body.data.accessToken;
              const newRefreshToken = body.data.refreshToken ?? refreshToken;
              await saveSecureStore(newAccessToken, newRefreshToken, stored.user);
              set({ accessToken: newAccessToken, refreshToken: newRefreshToken });
            }
          }
        } catch {
          // Best-effort: continue with stored tokens if refresh fails
        }
      }
    } else {
      set({ authState: 'guest' });
    }
  },

  login: async (email: string, password: string) => {
    const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);

    let response: Response;
    let body: any;
    try {
      response = await fetch(`${apiBase}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      body = await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new LoginError('NETWORK_ERROR', 'Request timed out');
      }
      if (err instanceof SyntaxError) {
        throw new LoginError('UNKNOWN', 'Invalid server response');
      }
      throw new LoginError('NETWORK_ERROR', 'Cần kết nối internet để đăng nhập');
    }

    if (!response.ok) {
      const errorCode = body?.error?.code;
      if (errorCode === 'AUTH_INVALID_CREDENTIALS') {
        throw new LoginError('AUTH_INVALID_CREDENTIALS', body.error.message);
      }
      if (errorCode === 'RATE_LIMIT_EXCEEDED') {
        throw new LoginError('RATE_LIMIT_EXCEEDED', body.error.message);
      }
      throw new LoginError('UNKNOWN', body?.error?.message || 'Login failed');
    }

    if (!body?.data?.tokens?.accessToken || !body?.data?.user) {
      throw new LoginError('UNKNOWN', 'Invalid server response');
    }

    const { user, tokens } = body.data;
    try {
      await saveSecureStore(tokens.accessToken, tokens.refreshToken, user);
    } catch {
      throw new LoginError('UNKNOWN', 'Failed to save credentials');
    }
    set({
      authState: 'authenticated',
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
    import('./storageAdapter').then((mod) =>
      mod.guestToAuthenticated().catch((err) =>
        console.error('[authStore] guestToAuthenticated failed after login:', err),
      ),
    );
  },

  register: async (email: string, password: string, displayName: string) => {
    const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);

    let response: Response;
    let body: any;
    try {
      response = await fetch(`${apiBase}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      body = await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new LoginError('NETWORK_ERROR', 'Request timed out');
      }
      if (err instanceof SyntaxError) {
        throw new LoginError('UNKNOWN', 'Invalid server response');
      }
      throw new LoginError('NETWORK_ERROR', 'Cần kết nối internet để đăng ký');
    }

    if (!response.ok) {
      const errorCode = body?.error?.code;
      if (errorCode === 'EMAIL_EXISTS') {
        throw new LoginError('AUTH_INVALID_CREDENTIALS', body.error.message);
      }
      if (errorCode === 'RATE_LIMIT_EXCEEDED') {
        throw new LoginError('RATE_LIMIT_EXCEEDED', body.error.message);
      }
      throw new LoginError('UNKNOWN', body?.error?.message || 'Registration failed');
    }

    if (!body?.data?.tokens?.accessToken || !body?.data?.user) {
      throw new LoginError('UNKNOWN', 'Invalid server response');
    }

    const { user, tokens } = body.data;
    try {
      await saveSecureStore(tokens.accessToken, tokens.refreshToken, user);
    } catch {
      throw new LoginError('UNKNOWN', 'Failed to save credentials');
    }
    set({
      authState: 'authenticated',
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
    import('./storageAdapter').then((mod) =>
      mod.guestToAuthenticated().catch((err) =>
        console.error('[authStore] guestToAuthenticated failed after register:', err),
      ),
    );
  },

  loginWithGoogle: async () => {
    const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      console.warn('[authStore] No EXPO_PUBLIC_GOOGLE_CLIENT_ID — using stub');
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
      return;
    }

    const redirectUri = AuthSession.makeRedirectUri({ scheme: 'hom-nay-an-gi' });
    const discovery = {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
    };

    const request = new AuthSession.AuthRequest({
      clientId: googleClientId,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.IdToken,
      usePKCE: false,
    });

    const result = await request.promptAsync(discovery);

    if (result.type !== 'success') {
      throw new LoginError('AUTH_INVALID_CREDENTIALS', 'Google sign-in cancelled');
    }

    const idToken = result.params.id_token;
    const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);

    let response: Response;
    let body: any;
    try {
      response = await fetch(`${apiBase}/api/v1/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      body = await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new LoginError('NETWORK_ERROR', 'Request timed out');
      }
      if (err instanceof SyntaxError) {
        throw new LoginError('UNKNOWN', 'Invalid server response');
      }
      throw new LoginError('NETWORK_ERROR', 'Google sign-in failed');
    }

    if (!response.ok) {
      const errorCode = body?.error?.code;
      if (errorCode === 'AUTH_INVALID_CREDENTIALS') {
        throw new LoginError('AUTH_INVALID_CREDENTIALS', body.error.message);
      }
      if (errorCode === 'RATE_LIMIT_EXCEEDED') {
        throw new LoginError('RATE_LIMIT_EXCEEDED', body.error.message);
      }
      throw new LoginError('AUTH_INVALID_CREDENTIALS', 'Google authentication failed');
    }

    if (!body?.data?.tokens?.accessToken || !body?.data?.user) {
      throw new LoginError('UNKNOWN', 'Invalid server response');
    }

    const { user, tokens } = body.data;
    try {
      await saveSecureStore(tokens.accessToken, tokens.refreshToken, user);
    } catch {
      throw new LoginError('UNKNOWN', 'Failed to save credentials');
    }
    set({
      authState: 'authenticated',
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
    import('./storageAdapter').then((mod) =>
      mod.guestToAuthenticated().catch((err) =>
        console.error('[authStore] guestToAuthenticated failed after Google login:', err),
      ),
    );
  },

  logout: async () => {
    const { accessToken } = get();
    if (accessToken) {
      const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
      try {
        await fetch(`${apiBase}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });
      } catch {
        // Best-effort: continue with local cleanup even if API is unreachable
      }
    }
    await clearSecureStore();
    try {
      const { useDataStore } = await import('./dataStore');
      useDataStore.getState().clearData();
    } catch {
      console.warn('[authStore] Failed to clear dataStore on logout');
    }
    set({
      authState: 'guest',
      user: null,
      accessToken: null,
      refreshToken: null,
    });
  },

  performTokenRefresh: async () => {
    const current = get();
    if (!current.refreshToken) {
      await current.logout();
      return;
    }

    const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);

    let response: Response;
    let body: any;
    try {
      response = await fetch(`${apiBase}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: current.refreshToken }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      body = await response.json();
    } catch {
      clearTimeout(timeoutId);
      await current.logout();
      return;
    }

    if (!response.ok) {
      await current.logout();
      return;
    }

    if (!body?.data?.accessToken) {
      await current.logout();
      return;
    }

    if (!current.user) {
      await current.logout();
      return;
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = body.data;

    try {
      await saveSecureStore(
        newAccessToken,
        newRefreshToken ?? current.refreshToken,
        current.user,
      );
    } catch {
      await current.logout();
      return;
    }

    set({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken ?? current.refreshToken,
    });
  },
}));
