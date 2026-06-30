import * as SQLite from 'expo-sqlite';
import { createApiClient, type ApiClient } from '../lib/api';
import { getApiBaseUrlOrThrow } from '../lib/env';
import { useAuthStore } from './authStore';

export type StorageTarget = 'sqlite' | 'api';

type SqliteRow = Record<string, unknown>;

const SAFE_TABLES: Record<string, string> = {
  dishes_cache: 'dishes_cache',
  favorites_guest: 'favorites_guest',
  search_history_guest: 'search_history_guest',
  shopping_lists_guest: 'shopping_lists_guest',
};

const SQLITE_ONLY_COLLECTIONS = new Set(['dishes_cache', 'favorites_guest', 'search_history_guest', 'shopping_lists_guest']);

function resolveTable(collection: string): string {
  const table = SAFE_TABLES[collection];
  if (!table) {
    throw new Error(`[storageAdapter] Unknown collection: ${collection}`);
  }
  return table;
}

let db: SQLite.SQLiteDatabase | null = null;
let dbReady: Promise<SQLite.SQLiteDatabase> | null = null;
let apiClient: ApiClient | null = null;
let sqliteFailed = false;

const memoryFavoritesGuest = new Map<string, unknown>();

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db && !dbReady) {
    dbReady = (async () => {
      const database = await SQLite.openDatabaseAsync('guest.db');
      const tables = [
        `CREATE TABLE IF NOT EXISTS dishes_cache (dishId TEXT PRIMARY KEY, dishData TEXT, cachedAt TEXT)`,
        `CREATE TABLE IF NOT EXISTS favorites_guest (dishId TEXT PRIMARY KEY, dishData TEXT, savedAt TEXT)`,
        `CREATE TABLE IF NOT EXISTS search_history_guest (id INTEGER PRIMARY KEY AUTOINCREMENT, ingredients TEXT, tags TEXT, cookTimeMax INTEGER, resultCount INTEGER, selectedDishId TEXT, createdAt TEXT)`,
        `CREATE TABLE IF NOT EXISTS shopping_lists_guest (id TEXT PRIMARY KEY, dishId TEXT, dishName TEXT, ingredients TEXT, checkedState TEXT, savedAt TEXT)`,
      ];
      for (const sql of tables) {
        await database.execAsync(sql);
      }
      db = database;
      dbReady = null;
      return database;
    })().catch((e) => {
      console.error('[storageAdapter] DB init error:', e);
      dbReady = null;
      throw e;
    });
  }
  const result = db ?? await dbReady!;
  return result;
}

function getApiClient(): ApiClient {
  if (!apiClient) {
    apiClient = createApiClient({
      baseUrl: getApiBaseUrlOrThrow(),
      getToken: async () => {
        const { accessToken } = useAuthStore.getState();
        return accessToken;
      },
      onTokenExpired: async () => {
        await useAuthStore.getState().performTokenRefresh();
      },
      onUnauthenticated: () => {
        void useAuthStore.getState().logout();
      },
    });
  }
  return apiClient;
}

function isAuthenticated(): boolean {
  return useAuthStore.getState().authState === 'authenticated';
}

export const storageAdapter = {
  getTarget(): StorageTarget {
    return isAuthenticated() ? 'api' : 'sqlite';
  },

  async read(collection: string, key: string): Promise<unknown | null> {
    if (isAuthenticated() && !SQLITE_ONLY_COLLECTIONS.has(collection)) {
      console.log(`[storageAdapter] authed → API read: ${collection}/${key}`);
      try {
        const client = getApiClient();
        const response = await client.get<unknown>(`/api/v1/${collection}/${key}`);
        return response.data;
      } catch {
        return null;
      }
    }

    console.log(`[storageAdapter] SQLite read: ${collection}/${key}`);
    try {
      const database = await getDb();

      if (collection === 'dishes_cache') {
        if (key === 'search' || key === 'trending' || key === 'nearby') {
          const rows = await database.getAllAsync<SqliteRow>(
            'SELECT dishData FROM dishes_cache WHERE dishId LIKE ?',
            [`%${key}%`],
          );
          return rows.map((r) => JSON.parse(r.dishData as string));
        }
        const row = await database.getFirstAsync<SqliteRow>(
          'SELECT dishData FROM dishes_cache WHERE dishId = ?',
          [key],
        );
        return row ? JSON.parse(row.dishData as string) : null;
      }

      if (collection === 'favorites_guest') {
        if (sqliteFailed) {
          if (key === 'all') {
            const items = [...memoryFavoritesGuest.values()] as {
              dishId: string;
              dishData: unknown;
              savedAt: string;
            }[];
            return items.sort((a, b) => (b.savedAt ?? '').localeCompare(a.savedAt ?? ''));
          }
          return memoryFavoritesGuest.get(key) ?? null;
        }
        if (key === 'all') {
          const rows = await database.getAllAsync<SqliteRow>('SELECT dishId, dishData, savedAt FROM favorites_guest ORDER BY savedAt DESC');
          return rows.flatMap((r) => {
            try {
              return [{
                dishId: r.dishId as string,
                dishData: JSON.parse(r.dishData as string),
                savedAt: r.savedAt as string,
              }];
            } catch {
              console.warn('[storageAdapter] Skipping invalid favorite dishData');
              return [];
            }
          });
        }
        const row = await database.getFirstAsync<SqliteRow>(
          'SELECT dishId, dishData, savedAt FROM favorites_guest WHERE dishId = ?',
          [key],
        );
        return row
          ? {
              dishId: row.dishId as string,
              dishData: JSON.parse(row.dishData as string),
              savedAt: row.savedAt as string,
            }
          : null;
      }

      if (collection === 'search_history_guest') {
        const rows = await database.getAllAsync<SqliteRow>(
          'SELECT * FROM search_history_guest ORDER BY createdAt DESC LIMIT 50',
        );
        return rows;
      }

      if (collection === 'shopping_lists_guest') {
        if (key === 'all') {
          const rows = await database.getAllAsync<SqliteRow>(
            'SELECT * FROM shopping_lists_guest ORDER BY savedAt DESC',
          );
          return rows.map((r) => ({
            ...r,
            ingredients: r.ingredients ? JSON.parse(r.ingredients as string) : [],
            checkedState: r.checkedState ? JSON.parse(r.checkedState as string) : {},
          }));
        }
        const row = await database.getFirstAsync<SqliteRow>(
          'SELECT * FROM shopping_lists_guest WHERE id = ?',
          [key],
        );
        return row
          ? {
              ...row,
              ingredients: row.ingredients ? JSON.parse(row.ingredients as string) : [],
              checkedState: row.checkedState ? JSON.parse(row.checkedState as string) : {},
            }
          : null;
      }

      return null;
    } catch (error) {
      console.error('[storageAdapter] SQLite read error:', error);
      db = null;
      dbReady = null;
      sqliteFailed = true;
      if (collection === 'favorites_guest') {
        if (key === 'all') {
          return [...memoryFavoritesGuest.values()].sort((a, b) =>
            ((b as Record<string, string>)?.savedAt ?? '').localeCompare((a as Record<string, string>)?.savedAt ?? ''),
          );
        }
        return memoryFavoritesGuest.get(key) ?? null;
      }
      return null;
    }
  },

  async write(collection: string, key: string, data: unknown): Promise<void> {
    if (key == null) {
      console.error(`[storageAdapter] write called with null/undefined key: collection=${collection}`);
      return;
    }
    if (isAuthenticated() && !SQLITE_ONLY_COLLECTIONS.has(collection)) {
      console.log(`[storageAdapter] authed → API write: ${collection}/${key}`);
      try {
        const client = getApiClient();
        await client.post(`/api/v1/${collection}`, { id: key, ...(data as Record<string, unknown>) });
      } catch (error) {
        console.error('[storageAdapter] API write error:', error);
      }
      return;
    }

    // Mirror into memory immediately so reads are consistent even if SQLite fails.
    if (collection === 'favorites_guest') {
      memoryFavoritesGuest.set(key, {
        dishId: key,
        dishData: data,
        savedAt: new Date().toISOString(),
      });
    }

    // If SQLite previously failed, still attempt a fresh write (error may have been transient).
    // Reset the flag so getDb() can try to reopen the database.
    if (sqliteFailed) {
      db = null;
      dbReady = null;
      sqliteFailed = false;
    }

    console.log(`[storageAdapter] SQLite write: ${collection}/${key}`);
    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const database = await getDb();
        const dataJson = JSON.stringify(data);
        const now = new Date().toISOString();

        if (collection === 'dishes_cache') {
          await database.runAsync(
            'INSERT OR REPLACE INTO dishes_cache (dishId, dishData, cachedAt) VALUES (?, ?, ?)',
            [key, dataJson, now],
          );
        } else if (collection === 'favorites_guest') {
          await database.runAsync(
            'INSERT OR REPLACE INTO favorites_guest (dishId, dishData, savedAt) VALUES (?, ?, ?)',
            [key, dataJson, now],
          );
        } else if (collection === 'search_history_guest') {
          await database.runAsync(
            'INSERT INTO search_history_guest (ingredients, createdAt) VALUES (?, ?)',
            [dataJson, now],
          );
        } else if (collection === 'shopping_lists_guest') {
          const record = data as Record<string, unknown>;
          await database.runAsync(
            `INSERT OR REPLACE INTO shopping_lists_guest (id, dishId, dishName, ingredients, checkedState, savedAt) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              key,
              (record.dishId as string) ?? null,
              (record.dishName as string) ?? null,
              record.ingredients ? JSON.stringify(record.ingredients) : '[]',
              record.checkedState ? JSON.stringify(record.checkedState) : '{}',
              now,
            ],
          );
        }
        return;
      } catch (error) {
        if (attempt < maxAttempts) {
          console.warn(`[storageAdapter] SQLite write retry ${attempt}: collection=${collection} key=${key}`);
          await new Promise((r) => setTimeout(r, 300));
          db = null;
          dbReady = null;
        } else {
          console.error(`[storageAdapter] SQLite write error: collection=${collection} key=${key}`, error);
          if (collection === 'favorites_guest') {
            console.warn('[storageAdapter] SQLite broken, falling back to in-memory for favorites_guest');
            // Memory was already mirrored above; just mark SQLite as unavailable.
            sqliteFailed = true;
          }
        }
      }
    }
  },

  async remove(collection: string, key: string): Promise<void> {
    if (isAuthenticated() && !SQLITE_ONLY_COLLECTIONS.has(collection)) {
      console.log(`[storageAdapter] authed → API remove: ${collection}/${key}`);
      try {
        const client = getApiClient();
        await client.delete(`/api/v1/${collection}/${key}`);
      } catch (error) {
        console.error('[storageAdapter] API remove error:', error);
      }
      return;
    }

    console.log(`[storageAdapter] SQLite remove: ${collection}/${key}`);
    if (sqliteFailed && collection === 'favorites_guest') {
      memoryFavoritesGuest.delete(key);
      return;
    }
    try {
      const database = await getDb();
      const table = resolveTable(collection);
      const pkColumn = (table === 'favorites_guest' || table === 'dishes_cache') ? 'dishId' : 'id';
      await database.runAsync(`DELETE FROM ${table} WHERE ${pkColumn} = ?`, [key]);
    } catch (error) {
      console.error('[storageAdapter] SQLite remove error:', error);
      db = null;
      dbReady = null;
      sqliteFailed = true;
      if (collection === 'favorites_guest') {
        memoryFavoritesGuest.delete(key);
      }
    }
  },

  async syncFromCloud(): Promise<void> {
    if (!isAuthenticated()) return;
    const client = getApiClient();
    try {
      await client.post('/api/v1/sync', {});
    } catch (error) {
      console.error('[storageAdapter] sync error:', error);
    }
  },
};

export async function clearGuestData(): Promise<void> {
  memoryFavoritesGuest.clear();
  try {
    const database = await getDb();
    await database.execAsync(`
      DELETE FROM dishes_cache;
      DELETE FROM favorites_guest;
      DELETE FROM search_history_guest;
      DELETE FROM shopping_lists_guest;
    `);
  } catch {
    console.warn('[storageAdapter] clearGuestData: tables may not exist');
  }
}

let _guestDeviceId: string | null = null;
function getGuestDeviceId(): string {
  if (!_guestDeviceId) {
    _guestDeviceId = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  return _guestDeviceId;
}

export async function guestToAuthenticated(): Promise<void> {
  if (!isAuthenticated()) return;

  let favorites: Array<{ dishId: string; dishData: Record<string, unknown>; savedAt: string }>;
  let history: Array<{
    ingredients: string[];
    tags?: string[];
    cookTimeMax?: number;
    resultCount?: number;
    selectedDishId?: string;
    createdAt?: string;
  }>;

  if (sqliteFailed) {
    // SQLite is unavailable — drain in-memory favorites accumulated during the guest session.
    console.warn('[storageAdapter] guestToAuthenticated: SQLite unavailable, reading from in-memory store');
    favorites = ([...memoryFavoritesGuest.values()] as Array<{
      dishId: string;
      dishData: Record<string, unknown>;
      savedAt: string;
    }>).sort((a, b) => (b.savedAt ?? '').localeCompare(a.savedAt ?? ''));
    history = [];
  } else {
    let database: SQLite.SQLiteDatabase;
    try {
      database = await getDb();
    } catch (err) {
      console.error('[storageAdapter] guestToAuthenticated: cannot open DB, reading from in-memory store', err);
      favorites = ([...memoryFavoritesGuest.values()] as Array<{
        dishId: string;
        dishData: Record<string, unknown>;
        savedAt: string;
      }>).sort((a, b) => (b.savedAt ?? '').localeCompare(a.savedAt ?? ''));
      history = [];
      // Fall through to sync what we have.
      const payload: Record<string, unknown> = {
        deviceId: getGuestDeviceId(),
        favorites,
        history,
        lastSyncAt: null,
      };
      const client = getApiClient();
      const maxRetries = 3;
      const delays = [1_000, 3_000, 9_000];
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          await client.post('/api/v1/sync', payload);
          memoryFavoritesGuest.clear();
          return;
        } catch (syncErr) {
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
          } else {
            console.error('[storageAdapter] guestToAuthenticated failed after retries:', syncErr);
            throw syncErr;
          }
        }
      }
      return;
    }

    const favoritesRows = await database.getAllAsync<SqliteRow>(
      'SELECT dishId, dishData, savedAt FROM favorites_guest ORDER BY savedAt DESC',
    );
    const sqliteFavorites = favoritesRows.flatMap((r) => {
      try {
        return [{
          dishId: r.dishId as string,
          dishData: JSON.parse(r.dishData as string) as Record<string, unknown>,
          savedAt: r.savedAt as string,
        }];
      } catch {
        console.warn('[storageAdapter] Skipping invalid favorite dishData');
        return [];
      }
    });

    // Merge: in-memory entries may contain items added after a transient SQLite failure
    // that were never persisted. Deduplicate by dishId, preferring the newer savedAt.
    const mergedMap = new Map<string, { dishId: string; dishData: Record<string, unknown>; savedAt: string }>();
    for (const fav of sqliteFavorites) {
      mergedMap.set(fav.dishId, fav);
    }
    for (const fav of memoryFavoritesGuest.values() as IterableIterator<{ dishId: string; dishData: Record<string, unknown>; savedAt: string }>) {
      const existing = mergedMap.get(fav.dishId);
      if (!existing || (fav.savedAt ?? '') > (existing.savedAt ?? '')) {
        mergedMap.set(fav.dishId, fav);
      }
    }
    favorites = [...mergedMap.values()].sort((a, b) => (b.savedAt ?? '').localeCompare(a.savedAt ?? ''));

    const historyRows = await database.getAllAsync<SqliteRow>(
      'SELECT * FROM search_history_guest ORDER BY createdAt DESC LIMIT 1000',
    );
    history = historyRows.map((r) => {
      let ingredients: string[];
      try {
        const parsed = JSON.parse(r.ingredients as string);
        ingredients = Array.isArray(parsed) ? parsed : [String(parsed)];
      } catch {
        ingredients = [(r.ingredients as string) ?? ''];
      }
      return {
        ingredients,
        tags: r.tags ? (r.tags as string).split(',').map((t) => t.trim()).filter(Boolean) : undefined,
        cookTimeMax: r.cookTimeMax as number | undefined,
        resultCount: r.resultCount as number | undefined,
        selectedDishId: r.selectedDishId as string | undefined,
        createdAt: r.createdAt as string | undefined,
      };
    });
  }

  const payload: Record<string, unknown> = {
    deviceId: getGuestDeviceId(),
    favorites,
    history,
    lastSyncAt: null,
  };

  const client = getApiClient();
  const maxRetries = 3;
  const delays = [1_000, 3_000, 9_000];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await client.post('/api/v1/sync', payload);
      await clearGuestData();
      return;
    } catch (err) {
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
      } else {
        console.error('[storageAdapter] guestToAuthenticated failed after retries:', err);
        throw err;
      }
    }
  }
}
