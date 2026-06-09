import type { ContributionData } from "../types/github"

const API_BASE = "/api/github"
const CACHE_KEY_PREFIX = "github-contribution-"
const CACHE_VERSION_KEY = "github-contribution-version"
const CACHE_VERSION = 2
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

interface CachedData {
  data: ContributionData
  timestamp: number
  version: number
}

function clearOldCache() {
  const storedVersion = localStorage.getItem(CACHE_VERSION_KEY)
  if (storedVersion !== String(CACHE_VERSION)) {
    const keys = Object.keys(localStorage)
    for (const key of keys) {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key)
      }
    }
    localStorage.setItem(CACHE_VERSION_KEY, String(CACHE_VERSION))
  }
}

export async function fetchContributionData(
  repo: string
): Promise<ContributionData> {
  clearOldCache()

  const cacheKey = `${CACHE_KEY_PREFIX}${repo}`

  // Check cache
  const cached = localStorage.getItem(cacheKey)
  if (cached) {
    try {
      const parsed: CachedData = JSON.parse(cached)
      if (
        parsed.version === CACHE_VERSION &&
        Date.now() - parsed.timestamp < CACHE_TTL
      ) {
        return parsed.data
      }
    } catch {
      // Invalid cache, continue to fetch
    }
  }

  // Fetch from API
  const response = await fetch(`${API_BASE}/contributions/${repo}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch contribution data: ${response.status}`)
  }

  const data = await response.json()

  // Check if response contains an error
  if (data.error) {
    throw new Error(data.error)
  }

  // Save to cache
  localStorage.setItem(
    cacheKey,
    JSON.stringify({
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    })
  )

  return data
}
