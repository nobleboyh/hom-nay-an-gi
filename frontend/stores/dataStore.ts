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
 *
 * Actions:
 *   fetchDishes(ingredients: string[], filters: FilterState): Promise<void>
 *   fetchRecipeDetail(dishId: string): Promise<void>
 *   fetchFavorites(): Promise<void>
 *   saveFavorite(dish: Dish): Promise<void>
 *   removeFavorite(dishId: string): Promise<void>
 *   fetchDiscoverTrending(cuisine?: string, price?: string): Promise<void>
 *   fetchDiscoverNearby(lat: number, lng: number): Promise<void>
 *   searchDishes(query: string): Dish[]
 *   clearSearchHistory(): void
 *   syncPreferences(prefs: Partial<UserPreference>): Promise<void>
 */

import { create } from 'zustand';
import type { Dish, Favorite, SearchHistoryItem, UserPreference } from '../types/dish';
import type { FilterState } from './uiStore';
import { storageAdapter } from './storageAdapter';

export type ScreenStatus = 'idle' | 'loading' | 'success' | 'error' | 'empty';

export interface DataStore {
  dishes: Dish[];
  favorites: Favorite[];
  searchHistory: SearchHistoryItem[];
  preferences: UserPreference | null;
  homeStatus: ScreenStatus;
  discoverStatus: ScreenStatus;
  favoritesStatus: ScreenStatus;
  recipeStatus: ScreenStatus;

  fetchDishes: (ingredients: string[], filters: FilterState) => Promise<void>;
  fetchRecipeDetail: (dishId: string) => Promise<void>;
  fetchFavorites: () => Promise<void>;
  saveFavorite: (dish: Dish) => Promise<void>;
  removeFavorite: (dishId: string) => Promise<void>;
  fetchDiscoverTrending: (cuisine?: string, price?: string) => Promise<void>;
  fetchDiscoverNearby: (lat: number, lng: number) => Promise<void>;
  searchDishes: (query: string) => Dish[];
  clearSearchHistory: () => void;
  syncPreferences: (prefs: Partial<UserPreference>) => Promise<void>;
}

export const useDataStore = create<DataStore>((set, get) => ({
  dishes: [],
  favorites: [],
  searchHistory: [],
  preferences: null,
  homeStatus: 'idle',
  discoverStatus: 'idle',
  favoritesStatus: 'idle',
  recipeStatus: 'idle',

  fetchDishes: async (ingredients, filters) => {
    console.log('[dataStore] stub: fetchDishes', { ingredients, filters });
    set({ homeStatus: 'loading' });
    try {
      const cached = await storageAdapter.read('dishes_cache', 'search');
      if (cached) {
        set({ dishes: cached as Dish[], homeStatus: 'success' });
      } else {
        set({ homeStatus: 'empty' });
      }
    } catch {
      set({ homeStatus: 'error' });
    }
  },

  fetchRecipeDetail: async (dishId) => {
    console.log('[dataStore] stub: fetchRecipeDetail', { dishId });
    set({ recipeStatus: 'loading' });
    try {
      const cached = await storageAdapter.read('dishes_cache', dishId);
      if (cached) {
        const current = get().dishes;
        set({
          recipeStatus: 'success',
          dishes: current.some((d: Dish) => d.id === dishId)
            ? current
            : [...current, cached as Dish],
        });
      } else {
        set({ recipeStatus: 'error' });
      }
    } catch {
      set({ recipeStatus: 'error' });
    }
  },

  fetchFavorites: async () => {
    console.log('[dataStore] stub: fetchFavorites');
    set({ favoritesStatus: 'loading' });
    try {
      const stored = await storageAdapter.read('favorites_guest', 'all');
      if (stored) {
        set({ favorites: stored as Favorite[], favoritesStatus: 'success' });
      } else {
        set({ favoritesStatus: 'empty' });
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

  clearSearchHistory: () => {
    console.log('[dataStore] stub: clearSearchHistory');
    set({ searchHistory: [] });
  },

  syncPreferences: async (prefs) => {
    console.log('[dataStore] stub: syncPreferences', prefs);
    set((state) => ({
      preferences: state.preferences
        ? { ...state.preferences, ...prefs }
        : (prefs as UserPreference),
    }));
  },
}));
