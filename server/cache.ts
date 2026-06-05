import { CachedData } from "./types.js"

const MEMORY_TTL = 60 * 60 * 1000 // 1 hour

export class CacheManager {
  private memoryCache: Map<string, CachedData> = new Map()

  get(key: string): CachedData | null {
    const cached = this.memoryCache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > MEMORY_TTL) {
      this.memoryCache.delete(key)
      return null
    }

    return cached
  }

  set(key: string, data: CachedData["data"]): void {
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  clear(): void {
    this.memoryCache.clear()
  }
}

export const cache = new CacheManager()
