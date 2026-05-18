/**
 * Local cache layer using IndexedDB.
 *
 * Stores codes and articles the user has already viewed so they load
 * instantly on repeat visits — even offline.
 *
 * Strategy: stale-while-revalidate
 *   1. Return cached data immediately (if available)
 *   2. Fetch fresh data from Supabase in background
 *   3. Update the cache silently
 */

import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'mudawwana';
const DB_VERSION = 1;

// Cache TTL — data older than this is considered stale but still served
const TTL = {
  codes:    24 * 60 * 60 * 1000,   // 24h — codes list rarely changes
  code:     12 * 60 * 60 * 1000,   // 12h — single code detail
  articles:  6 * 60 * 60 * 1000,   //  6h — articles list of a code
  article:  12 * 60 * 60 * 1000,   // 12h — single article
  search:    1 * 60 * 60 * 1000,   //  1h — search results
};

export type CacheStore = keyof typeof TTL;

interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  timestamp: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // One object store per data type
        for (const store of Object.keys(TTL)) {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'key' });
          }
        }
      },
    });
  }
  return dbPromise;
}

/** Read from cache. Returns null if not found. */
export async function cacheGet<T>(store: CacheStore, key: string): Promise<{ data: T; stale: boolean } | null> {
  try {
    const db = await getDB();
    if (!db) return null;
    const entry: CacheEntry<T> | undefined = await db.get(store, key);
    if (!entry) return null;
    const age = Date.now() - entry.timestamp;
    return { data: entry.data, stale: age > TTL[store] };
  } catch {
    return null;
  }
}

/** Write to cache. */
export async function cacheSet<T>(store: CacheStore, key: string, data: T): Promise<void> {
  try {
    const db = await getDB();
    if (!db) return;
    await db.put(store, { key, data, timestamp: Date.now() } satisfies CacheEntry<T>);
  } catch {
    // Silently fail — cache is best-effort
  }
}

/** Delete a single entry. */
export async function cacheDel(store: CacheStore, key: string): Promise<void> {
  try {
    const db = await getDB();
    if (!db) return;
    await db.delete(store, key);
  } catch {}
}

/** Clear an entire store. */
export async function cacheClear(store: CacheStore): Promise<void> {
  try {
    const db = await getDB();
    if (!db) return;
    await db.clear(store);
  } catch {}
}

/** Clear all stores (full reset). */
export async function cacheReset(): Promise<void> {
  try {
    const db = await getDB();
    if (!db) return;
    for (const store of Object.keys(TTL)) {
      await db.clear(store);
    }
  } catch {}
}

/**
 * Stale-while-revalidate pattern.
 *
 * Usage:
 *   const codes = await swr('codes', 'all', fetchCodesFromSupabase);
 *
 * Returns cached data immediately if available.
 * Revalidates in the background and updates the cache.
 * If no cache exists, awaits the fresh fetch.
 */
export async function swr<T>(
  store: CacheStore,
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await cacheGet<T>(store, key);

  if (cached && !cached.stale) {
    // Fresh cache — return immediately, no fetch needed
    return cached.data;
  }

  if (cached && cached.stale) {
    // Stale cache — return immediately, revalidate in background
    fetcher().then(fresh => cacheSet(store, key, fresh)).catch(() => {});
    return cached.data;
  }

  // No cache — must await the fetch
  const fresh = await fetcher();
  await cacheSet(store, key, fresh);
  return fresh;
}
