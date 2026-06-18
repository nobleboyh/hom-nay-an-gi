/**
 * DataStore Contract (FROZEN for Epic 2):
 *
 * State:
 *   dishes: Dish[]
 *   favorites: Favorite[]
 *   searchHistory: SearchHistoryItem[]
 *   preferences: UserPreference | null
 *   homeStatus: ScreenStatus
 *   discoverStatus: ScreenStatus
 *   favoritesStatus: ScreenStatus
 *   recipeStatus: ScreenStatus
 *   resultsStatus: ScreenStatus
 *   offset: number
 *   total: number
 *   lastIngredients: string[]
 *   lastFilters: FilterState | null
 *
 * Actions:
 *   fetchDishes(ingredients: string[], filters: FilterState, offset?: number): Promise<void>
 *   fetchRecipeDetail(dishId: string): Promise<void>
 *   fetchFavorites(): Promise<void>
 *   saveFavorite(dish: Dish): Promise<void>
 *   removeFavorite(dishId: string): Promise<void>
 *   fetchDiscoverTrending(cuisine?: string, price?: string): Promise<void>
 *   fetchDiscoverNearby(lat: number, lng: number): Promise<void>
 *   searchDishes(query: string): Dish[]
 *   clearSearchHistory(): void
 *   syncPreferences(prefs: Partial<UserPreference>): Promise<void>
 *   fetchSurpriseMe(): Promise<void>
 */

import { create } from 'zustand';
import type { Dish, Favorite, RecipeDetail, SearchHistoryItem, UserPreference } from '../types/dish';
import type { FilterState } from './uiStore';
import { storageAdapter, clearGuestData } from './storageAdapter';
import { useAuthStore } from './authStore';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export type ScreenStatus = 'idle' | 'loading' | 'success' | 'error' | 'empty';

export interface DataStore {
  dishes: Dish[];
  favorites: Favorite[];
  searchHistory: SearchHistoryItem[];
  preferences: UserPreference | null;
  preferencesStatus: ScreenStatus;
  homeStatus: ScreenStatus;
  discoverStatus: ScreenStatus;
  favoritesStatus: ScreenStatus;
  recipeStatus: ScreenStatus;
  resultsStatus: ScreenStatus;
  offset: number;
  total: number;
  recipeDetail: RecipeDetail | null;
  lastIngredients: string[];
  lastFilters: FilterState | null;

  fetchDishes: (ingredients: string[], filters: FilterState, offset?: number) => Promise<void>;
  fetchRecipeDetail: (dishId: string) => Promise<void>;
  fetchFavorites: (opts?: { offset?: number; limit?: number }) => Promise<void>;
  favoritesTotal: number;
  saveFavorite: (dish: Dish) => Promise<void>;
  removeFavorite: (dishId: string) => Promise<void>;
  fetchDiscoverTrending: (cuisine?: string, price?: string) => Promise<void>;
  fetchDiscoverNearby: (lat: number, lng: number) => Promise<void>;
  fetchSurpriseMe: () => Promise<void>;
  searchDishes: (query: string) => Dish[];
  clearSearchHistory: () => void;
  clearAllFavorites: () => Promise<void>;
  clearData: () => Promise<void>;
  syncPreferences: (prefs: Partial<UserPreference>) => Promise<void>;
  fetchPreferences: () => Promise<void>;
}

export const useDataStore = create<DataStore>((set, get) => ({
  dishes: [],
  favorites: [],
  searchHistory: [],
  preferences: null,
  preferencesStatus: 'idle',
  homeStatus: 'idle',
  discoverStatus: 'idle',
  favoritesStatus: 'idle',
  recipeStatus: 'idle',
  resultsStatus: 'idle',
  offset: 0,
  total: 0,
  favoritesTotal: 0,
  recipeDetail: null,
  lastIngredients: [],
  lastFilters: null,

  fetchDishes: async (ingredients, filters, offset = 0) => {
    console.log('[dataStore] fetchDishes', { ingredients, filters, offset });
    set({ lastIngredients: ingredients, lastFilters: filters });

    if (offset === 0) {
      set({ homeStatus: 'loading', resultsStatus: 'loading' });
    }

    try {
      const params = new URLSearchParams();
      if (ingredients.length > 0) params.set('ingredients', ingredients.join(','));
      if (filters.foodTypes.length > 0) params.set('tags', filters.foodTypes.join(','));
      if (filters.cuisines.length > 0) {
        const existing = params.get('tags');
        params.set('tags', existing ? `${existing},${filters.cuisines.join(',')}` : filters.cuisines.join(','));
      }
      if (filters.cookTime) params.set('cookTime', String(filters.cookTime));
      params.set('offset', String(offset));
      params.set('limit', '20');

      const response = await fetch(`${API_BASE}/api/v1/recipes/search?${params.toString()}`, {
        headers: { 'x-guest-id': 'web' },
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const body = await response.json() as {
        success: boolean;
        data: { dishes: Dish[]; total: number; offset: number; limit: number };
      };

      if (!body.success) throw new Error('API returned unsuccessful');

      const { dishes: results, total } = body.data;

      await storageAdapter.write('dishes_cache', 'search', results as unknown as Record<string, unknown>[]);

      if (offset === 0) {
        set({
          dishes: results,
          homeStatus: results.length === 0 ? 'empty' : 'success',
          resultsStatus: results.length === 0 ? 'empty' : 'success',
          offset,
          total,
        });
      } else {
        set((state) => ({
          dishes: [...state.dishes, ...results],
          resultsStatus: results.length === 0 ? 'empty' : 'success',
          offset,
          total,
        }));
      }
    } catch {
      set((state) => ({
        ...(offset === 0 ? { homeStatus: 'error' as const } : {}),
        resultsStatus: 'error' as const,
      }));
    }
  },

  fetchSurpriseMe: async () => {
    console.log('[dataStore] fetchSurpriseMe');
    set({ homeStatus: 'loading' });
    try {
      const response = await fetch(`${API_BASE}/api/v1/recipes/surprise`, {
        headers: { 'x-guest-id': 'web' },
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const body = await response.json() as {
        success: boolean;
        data: Dish;
      };

      if (!body.success) throw new Error('API returned unsuccessful');

      await storageAdapter.write('dishes_cache', 'surprise', body.data as unknown as Record<string, unknown>);

      set({
        dishes: [body.data],
        homeStatus: 'success',
      });
    } catch {
      set({ homeStatus: 'error' });
    }
  },

  fetchRecipeDetail: async (dishId) => {
    console.log('[dataStore] fetchRecipeDetail', { dishId });
    set({ recipeStatus: 'loading' });
    try {
      const response = await fetch(`${API_BASE}/api/v1/recipes/${encodeURIComponent(dishId)}`, {
        headers: { 'x-guest-id': 'web' },
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const body = await response.json() as {
        success: boolean;
        data: RecipeDetail;
      };

      if (!body.success) throw new Error('API returned unsuccessful');

      const detail = body.data;

      await storageAdapter.write('dishes_cache', dishId, detail as unknown as Record<string, unknown>);

      set({ recipeStatus: 'success', recipeDetail: detail });
    } catch {
      set({ recipeStatus: 'error', recipeDetail: null });
    }
  },

  fetchFavorites: async (opts) => {
    const offset = opts?.offset ?? 0;
    const limit = opts?.limit ?? 20;
    const target = storageAdapter.getTarget();

    console.log('[dataStore] fetchFavorites', { target, offset, limit });

    if (offset === 0) {
      set({ favoritesStatus: 'loading' });
    }

    try {
      if (target === 'api') {
        const token = useAuthStore.getState().accessToken;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) { headers['Authorization'] = `Bearer ${token}`; }
        const params = new URLSearchParams();
        params.set('offset', String(offset));
        params.set('limit', String(limit));
        const response = await fetch(
          `${API_BASE}/api/v1/favorites?${params.toString()}`,
          { headers },
        );
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const body = (await response.json()) as {
          success: boolean;
          data: { items: Favorite[]; total: number; offset: number; limit: number };
        };
        if (!body.success) throw new Error('API returned unsuccessful');
        const { items, total } = body.data;
        if (offset === 0) {
          set({ favorites: items, favoritesTotal: total, favoritesStatus: items.length === 0 ? 'empty' : 'success' });
        } else {
          set((state) => ({
            favorites: [...state.favorites, ...items],
            favoritesTotal: total,
            favoritesStatus: items.length === 0 ? 'empty' : 'success',
          }));
        }
      } else {
        const stored = await storageAdapter.read('favorites_guest', 'all');
        if (Array.isArray(stored) && stored.length > 0) {
          const items = stored as Favorite[];
          const total = items.length;
          const page = items.slice(offset, offset + limit);
          if (offset === 0) {
            set({ favorites: page, favoritesTotal: total, favoritesStatus: 'success' });
          } else {
            set((state) => ({
              favorites: [...state.favorites, ...page],
              favoritesTotal: total,
              favoritesStatus: 'success',
            }));
          }
        } else {
          set({ favorites: [], favoritesTotal: 0, favoritesStatus: 'empty' });
        }
      }
    } catch {
      set({ favoritesStatus: 'error' });
    }
  },

  saveFavorite: async (dish) => {
    console.log('[dataStore] stub: saveFavorite', { dishId: dish.id });
    const { favorites } = get();
    if (favorites.some((f) => f.dishId === dish.id)) return;
    await storageAdapter.write('favorites_guest', dish.id, dish);
    set({ favorites: [...favorites, { dishId: dish.id, dishData: dish, savedAt: new Date().toISOString() }] });
  },

  removeFavorite: async (dishId) => {
    console.log('[dataStore] stub: removeFavorite', { dishId });
    await storageAdapter.remove('favorites_guest', dishId);
    set((state) => ({
      favorites: state.favorites.filter((f) => f.dishId !== dishId),
    }));
  },

  fetchDiscoverTrending: async (cuisine?, price?) => {
    console.log('[dataStore] stub: fetchDiscoverTrending', { cuisine, price });
    set({ discoverStatus: 'loading' });
    try {
      const cached = await storageAdapter.read('dishes_cache', 'trending');
      if (cached) {
        set({ dishes: cached as Dish[], discoverStatus: 'success' });
      } else {
        set({ discoverStatus: 'empty' });
      }
    } catch {
      set({ discoverStatus: 'error' });
    }
  },

  fetchDiscoverNearby: async (lat, lng) => {
    console.log('[dataStore] stub: fetchDiscoverNearby', { lat, lng });
    set({ discoverStatus: 'loading' });
    try {
      const cached = await storageAdapter.read('dishes_cache', 'nearby');
      if (cached) {
        set({ dishes: cached as Dish[], discoverStatus: 'success' });
      } else {
        set({ discoverStatus: 'empty' });
      }
    } catch {
      set({ discoverStatus: 'error' });
    }
  },

  searchDishes: (query) => {
    console.log('[dataStore] stub: searchDishes', { query });
    const normalized = query.toLowerCase();
    const results = get().dishes.filter(
      (d) => d.name.toLowerCase().includes(normalized),
    );
    if (normalized.length > 0) {
      const entry: SearchHistoryItem = {
        id: Date.now(),
        ingredients: query,
        tags: '',
        cookTimeMax: 0,
        resultCount: results.length,
        selectedDishId: null,
        createdAt: new Date().toISOString(),
      };
      const history = [entry, ...get().searchHistory.slice(0, 49)];
      set({ searchHistory: history });
    }
    return results;
  },

  clearSearchHistory: async () => {
    set({ searchHistory: [] });
    const target = storageAdapter.getTarget();
    if (target === 'api') {
      const token = useAuthStore.getState().accessToken;
      try {
        await fetch(`${API_BASE}/api/v1/settings/search-history`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      } catch {
        // best-effort — local state already cleared
      }
    }
  },

  clearAllFavorites: async () => {
    const target = storageAdapter.getTarget();
    if (target === 'api') {
      const token = useAuthStore.getState().accessToken;
      const response = await fetch(`${API_BASE}/api/v1/favorites`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
    }
    try {
      await storageAdapter.write('favorites_guest', 'all', []);
    } catch {
      // best-effort
    }
    set({ favorites: [], favoritesTotal: 0, favoritesStatus: 'idle' });
  },

  clearData: async () => {
    set({
      dishes: [],
      favorites: [],
      searchHistory: [],
      preferences: null,
      homeStatus: 'idle',
      discoverStatus: 'idle',
      favoritesStatus: 'idle',
      recipeStatus: 'idle',
      resultsStatus: 'idle',
      offset: 0,
      total: 0,
      recipeDetail: null,
      lastIngredients: [],
      lastFilters: null,
    });
    try {
      await clearGuestData();
    } catch {
      console.warn('[dataStore] Failed to clear guest data');
    }
  },

  fetchPreferences: async () => {
    const target = storageAdapter.getTarget();
    set({ preferencesStatus: 'loading' });
    try {
      if (target === 'api') {
        let token = useAuthStore.getState().accessToken;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) { headers['Authorization'] = `Bearer ${token}`; }
        let response = await fetch(`${API_BASE}/api/v1/settings/preferences`, { headers });

        if (response.status === 401) {
          await useAuthStore.getState().performTokenRefresh();
          token = useAuthStore.getState().accessToken;
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            response = await fetch(`${API_BASE}/api/v1/settings/preferences`, { headers });
          }
        }

        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const body = await response.json() as { success: boolean; data: UserPreference };
        if (!body.success) throw new Error('API returned unsuccessful');
        set({ preferences: body.data, preferencesStatus: 'success' });
      } else {
        const stored = await storageAdapter.read('dishes_cache', 'guest_preferences');
        if (stored) {
          set({ preferences: stored as UserPreference, preferencesStatus: 'success' });
        } else {
          set({ preferencesStatus: 'idle' });
        }
      }
    } catch {
      set({ preferencesStatus: 'error' });
    }
  },

  syncPreferences: (() => {
    let pending: Promise<void> | null = null;

    return async (prefs: Partial<UserPreference>) => {
      set((state) => {
        const defaults: UserPreference = {
          dietaryPreferences: [],
          allergies: [],
          dislikedIngredients: [],
          preferredCuisines: [],
          measurementUnit: 'metric',
          theme: 'light',
          language: 'vi',
          notifications: {
            breakfastReminder: false,
            lunchReminder: false,
            dinnerReminder: false,
            dailySuggestion: false,
          },
        };
        const merged = state.preferences
          ? { ...state.preferences, ...prefs }
          : { ...defaults, ...prefs };
        return { preferences: merged };
      });

      const target = storageAdapter.getTarget();
      if (target !== 'api') {
        try {
          await storageAdapter.write('dishes_cache', 'guest_preferences', prefs as unknown as Record<string, unknown>);
        } catch {
          // best-effort
        }
        return;
      }

      const chain = async () => {
        const token = useAuthStore.getState().accessToken;
        const response = await fetch(`${API_BASE}/api/v1/settings/preferences`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(prefs),
        });
        if (!response.ok) throw new Error(`API error: ${response.status}`);
      };

      pending = (pending ?? Promise.resolve()).then(chain).catch(() => {
        // best-effort — optimistic UI already applied
      });

      await pending;
    };
  })(),
}));
