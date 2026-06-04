import type { ContributionData } from '@/types/github'

const API_BASE = '/api/github'
const CACHE_KEY_PREFIX = 'github-contribution-'
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

interface CachedData {
  data: ContributionData
  timestamp: number
}

export async function fetchContributionData(repo: string): Promise<ContributionData> {
  const cacheKey = `${CACHE_KEY_PREFIX}${repo}`
  
  // Check cache
  const cached = localStorage.getItem(cacheKey)
  if (cached) {
    try {
      const parsed: CachedData = JSON.parse(cached)
      if (Date.now() - parsed.timestamp < CACHE_TTL) {
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

  // Save to cache
  localStorage.setItem(cacheKey, JSON.stringify({
    data,
    timestamp: Date.now()
  }))

  return data
}
