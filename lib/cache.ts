/**
 * Local cache layer using IndexedDB.
 *
 * Two purposes:
 *   1. SWR cache — auto-cache pages visited (with TTL)
 *   2. Offline codes — user explicitly downloads a full code for offline use (no TTL)
 */

import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'mudawwana';
const DB_VERSION = 2; // bumped for offline_codes store

// ── SWR Cache stores (with TTL) ──────────────────────────────
const TTL = {
  codes:    24 * 60 * 60 * 1000,
  code:     12 * 60 * 60 * 1000,
  articles:  6 * 60 * 60 * 1000,
  article:  12 * 60 * 60 * 1000,
  search:    1 * 60 * 60 * 1000,
};

export type CacheStore = keyof typeof TTL;

interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  timestamp: number;
}

// ── Offline Code types ───────────────────────────────────────
export interface OfflineArticle {
  id: string;
  number: string;
  number_int: number | null;
  content_ar: string;
  content_fr?: string | null;
  section_title?: string | null;
  status: string;
}

export interface OfflineCode {
  id: string;
  title_ar: string;
  title_fr?: string | null;
  articles: OfflineArticle[];
  downloaded_at: number;
  total_articles: number;
}

// ── DB init ──────────────────────────────────────────────────
let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        for (const store of Object.keys(TTL)) {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'key' });
          }
        }
        // Offline codes — keyed by code ID, no TTL
        if (!db.objectStoreNames.contains('offline_codes')) {
          db.createObjectStore('offline_codes', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

// ── SWR cache helpers ────────────────────────────────────────

export async function cacheGet<T>(store: CacheStore, key: string): Promise<{ data: T; stale: boolean } | null> {
  try {
    const db = await getDB();
    if (!db) return null;
    const entry: CacheEntry<T> | undefined = await db.get(store, key);
    if (!entry) return null;
    const age = Date.now() - entry.timestamp;
    return { data: entry.data, stale: age > TTL[store] };
  } catch { return null; }
}

export async function cacheSet<T>(store: CacheStore, key: string, data: T): Promise<void> {
  try {
    const db = await getDB();
    if (!db) return;
    await db.put(store, { key, data, timestamp: Date.now() } satisfies CacheEntry<T>);
  } catch {}
}

export async function cacheDel(store: CacheStore, key: string): Promise<void> {
  try {
    const db = await getDB();
    if (!db) return;
    await db.delete(store, key);
  } catch {}
}

export async function cacheClear(store: CacheStore): Promise<void> {
  try {
    const db = await getDB();
    if (!db) return;
    await db.clear(store);
  } catch {}
}

export async function cacheReset(): Promise<void> {
  try {
    const db = await getDB();
    if (!db) return;
    for (const store of Object.keys(TTL)) {
      await db.clear(store);
    }
  } catch {}
}

export async function swr<T>(
  store: CacheStore,
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await cacheGet<T>(store, key);
  if (cached && !cached.stale) return cached.data;
  if (cached && cached.stale) {
    fetcher().then(fresh => cacheSet(store, key, fresh)).catch(() => {});
    return cached.data;
  }
  const fresh = await fetcher();
  await cacheSet(store, key, fresh);
  return fresh;
}

// ── Offline codes (user-triggered, persistent) ───────────────

/** Save a full code with all its articles for offline use. */
export async function saveOfflineCode(code: OfflineCode): Promise<void> {
  try {
    const db = await getDB();
    if (!db) return;
    await db.put('offline_codes', code);
  } catch {}
}

/** Get a saved offline code. */
export async function getOfflineCode(codeId: string): Promise<OfflineCode | null> {
  try {
    const db = await getDB();
    if (!db) return null;
    return (await db.get('offline_codes', codeId)) ?? null;
  } catch { return null; }
}

/** List all saved offline codes (metadata only, no articles). */
export async function listOfflineCodes(): Promise<Omit<OfflineCode, 'articles'>[]> {
  try {
    const db = await getDB();
    if (!db) return [];
    const all: OfflineCode[] = await db.getAll('offline_codes');
    return all.map(({ articles, ...meta }) => meta);
  } catch { return []; }
}

/** Delete a saved offline code. */
export async function deleteOfflineCode(codeId: string): Promise<void> {
  try {
    const db = await getDB();
    if (!db) return;
    await db.delete('offline_codes', codeId);
  } catch {}
}

/** Check if a code is saved offline. */
export async function isCodeOffline(codeId: string): Promise<boolean> {
  try {
    const db = await getDB();
    if (!db) return false;
    const key = await db.getKey('offline_codes', codeId);
    return key !== undefined;
  } catch { return false; }
}

/** Search offline articles of a code by text. */
export async function searchOfflineArticles(
  codeId: string,
  query: string,
): Promise<OfflineArticle[]> {
  const code = await getOfflineCode(codeId);
  if (!code) return [];

  const words = query.trim().toLowerCase().split(/[\s,،.;:]+/).filter(w => w.length >= 2);
  if (words.length === 0) return code.articles;

  const threshold = Math.ceil(words.length * 0.5);

  return code.articles.filter(article => {
    const text = article.content_ar.toLowerCase();
    const matchCount = words.filter(w => text.includes(w)).length;
    return matchCount >= threshold;
  });
}
