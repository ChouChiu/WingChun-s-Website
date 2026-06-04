import type { ContributionData } from '@/types/github'

const API_BASE = '/api/github'

export async function fetchContributionData(repo: string): Promise<ContributionData> {
  const response = await fetch(`${API_BASE}/contributions/${repo}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch contribution data: ${response.status}`)
  }

  return response.json()
}
