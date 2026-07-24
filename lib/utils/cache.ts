/**
 * Simple in-memory cache implementation for client-side data
 */
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

const memoryCache = new Map<string, CacheEntry<any>>()

/**
 * Get cached data if still valid
 */
export function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key)

  if (!entry) {
    return null
  }

  const now = Date.now()
  const isExpired = now - entry.timestamp > entry.ttl

  if (isExpired) {
    memoryCache.delete(key)
    return null
  }

  return entry.data
}

/**
 * Set data in cache
 */
export function setCache<T>(key: string, data: T, ttl: number = 60000): void {
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  })
}

/**
 * Clear specific cache entry
 */
export function clearCache(key: string): void {
  memoryCache.delete(key)
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  memoryCache.clear()
}

/**
 * Wrap a fetch function with caching
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 60000
): Promise<T> {
  const cached = getCached<T>(key)

  if (cached) {
    return cached
  }

  const data = await fetcher()
  setCache(key, data, ttl)

  return data
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats() {
  const now = Date.now()
  const stats = {
    totalEntries: memoryCache.size,
    entries: [] as Array<{ key: string; age: number; ttl: number; expired: boolean }>,
  }

  memoryCache.forEach((entry, key) => {
    const age = now - entry.timestamp
    const expired = age > entry.ttl

    stats.entries.push({
      key,
      age,
      ttl: entry.ttl,
      expired,
    })
  })

  return stats
}
