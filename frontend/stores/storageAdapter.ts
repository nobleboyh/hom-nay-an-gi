import * as SQLite from 'expo-sqlite';
import { createApiClient, type ApiClient } from '../lib/api';
import { useAuthStore } from './authStore';

export type StorageTarget = 'sqlite' | 'api';

type SqliteRow = Record<string, unknown>;

const SAFE_TABLES: Record<string, string> = {
  dishes_cache: 'dishes_cache',
  favorites_guest: 'favorites_guest',
  search_history_guest: 'search_history_guest',
  shopping_lists_guest: 'shopping_lists_guest',
};

function resolveTable(collection: string): string {
  const table = SAFE_TABLES[collection];
  if (!table) {
    throw new Error(`[storageAdapter] Unknown collection: ${collection}`);
  }
  return table;
}

let db: SQLite.SQLiteDatabase | null = null;
let apiClient: ApiClient | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('guest.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS dishes_cache (
        dishId TEXT PRIMARY KEY,
        dishData TEXT,
        cachedAt TEXT
      );
      CREATE TABLE IF NOT EXISTS favorites_guest (
        dishId TEXT PRIMARY KEY,
        dishData TEXT,
        savedAt TEXT
      );
      CREATE TABLE IF NOT EXISTS search_history_guest (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ingredients TEXT,
        tags TEXT,
        cookTimeMax INTEGER,
        resultCount INTEGER,
        selectedDishId TEXT,
        createdAt TEXT
      );
      CREATE TABLE IF NOT EXISTS shopping_lists_guest (
        id TEXT PRIMARY KEY,
        dishId TEXT,
        dishName TEXT,
        ingredients TEXT,
        checkedState TEXT,
        savedAt TEXT
      );
    `);
  }
  return db;
}

function getApiClient(): ApiClient {
  if (!apiClient) {
    apiClient = createApiClient({
      baseUrl: process.env.API_BASE_URL || 'http://localhost:8080',
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
    if (isAuthenticated()) {
      console.log(`[storageAdapter] authed → API read: ${collection}/${key}`);
      try {
        const client = getApiClient();
        const response = await client.get<unknown>(`/api/v1/${collection}/${key}`);
        return response.data;
      } catch {
        return null;
      }
    }

    console.log(`[storageAdapter] guest → SQLite read: ${collection}/${key}`);
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
        if (key === 'all') {
          const rows = await database.getAllAsync<SqliteRow>('SELECT dishData FROM favorites_guest ORDER BY savedAt DESC');
          return rows.map((r) => JSON.parse(r.dishData as string));
        }
        const row = await database.getFirstAsync<SqliteRow>(
          'SELECT dishData FROM favorites_guest WHERE dishId = ?',
          [key],
        );
        return row ? JSON.parse(row.dishData as string) : null;
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
      return null;
    }
  },

  async write(collection: string, key: string, data: unknown): Promise<void> {
    if (isAuthenticated()) {
      console.log(`[storageAdapter] authed → API write: ${collection}/${key}`);
      try {
        const client = getApiClient();
        await client.post(`/api/v1/${collection}`, { id: key, ...(data as Record<string, unknown>) });
      } catch (error) {
        console.error('[storageAdapter] API write error:', error);
      }
      return;
    }

    console.log(`[storageAdapter] guest → SQLite write: ${collection}/${key}`);
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
    } catch (error) {
      console.error('[storageAdapter] SQLite write error:', error);
    }
  },

  async remove(collection: string, key: string): Promise<void> {
    if (isAuthenticated()) {
      console.log(`[storageAdapter] authed → API remove: ${collection}/${key}`);
      try {
        const client = getApiClient();
        await client.delete(`/api/v1/${collection}/${key}`);
      } catch (error) {
        console.error('[storageAdapter] API remove error:', error);
      }
      return;
    }

    console.log(`[storageAdapter] guest → SQLite remove: ${collection}/${key}`);
    try {
      const database = await getDb();
      const table = resolveTable(collection);
      await database.runAsync(`DELETE FROM ${table} WHERE dishId = ?`, [key]);
    } catch (error) {
      console.error('[storageAdapter] SQLite remove error:', error);
    }
  },

  async syncFromCloud(): Promise<void> {
    console.log('[storageAdapter] stub: syncFromCloud — real sync deferred to Epic 3');
    if (!isAuthenticated()) return;
    try {
      const client = getApiClient();
      const response = await client.post<unknown>('/api/v1/sync', {});
      console.log('[storageAdapter] sync response:', response.data);
    } catch (error) {
      console.error('[storageAdapter] sync error:', error);
    }
  },
};
