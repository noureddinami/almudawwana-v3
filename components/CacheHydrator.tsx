'use client';

import { useEffect } from 'react';
import { cacheSet, type CacheStore } from '@/lib/cache';

/**
 * Invisible component that saves server-fetched data into IndexedDB.
 * Drop it into any server component page to enable offline access.
 *
 * <CacheHydrator store="codes" cacheKey="all" data={codes} />
 */
interface Props {
  store: CacheStore;
  cacheKey: string;
  data: unknown;
}

export default function CacheHydrator({ store, cacheKey, data }: Props) {
  useEffect(() => {
    if (data != null) {
      cacheSet(store, cacheKey, data);
    }
  }, [store, cacheKey, data]);

  return null;
}
