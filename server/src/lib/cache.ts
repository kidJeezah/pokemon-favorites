import { LRUCache } from 'lru-cache';
import { logger } from './logger.js';

const cache = new LRUCache<string, Promise<unknown>>({
  max: 1000,
  ttl: 24 * 60 * 60 * 1000,
});

/**
 * Caches the in-flight promise so concurrent requests share one upstream call
 * (stampede protection). Rejected promises are evicted — errors are never cached.
 */
export function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = cache.get(key);
  if (existing) {
    logger.info({ key, source: 'cache' }, 'served from LRU cache');
    return existing as Promise<T>;
  }

  logger.info({ key, source: 'upstream' }, 'cache miss — fetching upstream');
  const promise = fn().catch((err: unknown) => {
    cache.delete(key);
    throw err;
  });
  cache.set(key, promise);
  return promise;
}

export function clearCache(): void {
  cache.clear();
}
