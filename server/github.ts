import { GitHubRepo, GitHubContributor, GitHubStats, ContributionData } from './types.js'

const GITHUB_API = 'https://api.github.com'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''

async function fetchGitHub<T>(endpoint: string): Promise<T> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'GitHub-Contribution-API'
  }

  if (GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`
  }

  const response = await fetch(`${GITHUB_API}${endpoint}`, { headers })

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<T>
}

export async function getRepoInfo(owner: string, repo: string): Promise<GitHubRepo> {
  return fetchGitHub<GitHubRepo>(`/repos/${owner}/${repo}`)
}

export async function getContributors(owner: string, repo: string): Promise<GitHubContributor[]> {
  return fetchGitHub<GitHubContributor[]>(`/repos/${owner}/${repo}/contributors`)
}

export async function getContributorStats(owner: string, repo: string, username: string): Promise<GitHubStats | null> {
  try {
    const stats = await fetchGitHub<GitHubStats[]>(`/repos/${owner}/${repo}/stats/contributors`)
    const userStats = stats.find(s => s.author?.login === username)
    return userStats || null
  } catch {
    return null
  }
}

export async function getContributionData(owner: string, repo: string, username: string): Promise<ContributionData> {
  const [repoInfo] = await Promise.all([
    getRepoInfo(owner, repo),
    getContributors(owner, repo)
  ])

  const stats = await getContributorStats(owner, repo, username)

  let additions = 0
  let deletions = 0
  let lastContributionDate: string | null = null

  if (stats && stats.weeks.length > 0) {
    const totalWeeks = stats.weeks
    additions = totalWeeks.reduce((sum, week) => sum + week.a, 0)
    deletions = totalWeeks.reduce((sum, week) => sum + week.d, 0)

    const lastWeek = totalWeeks[totalWeeks.length - 1]
    if (lastWeek) {
      const date = new Date(parseInt(lastWeek.w) * 1000)
      lastContributionDate = date.toISOString().split('T')[0]
    }
  }

  return {
    repo: repoInfo.full_name,
    repoUrl: repoInfo.html_url,
    stars: repoInfo.stargazers_count,
    owner: {
      login: repoInfo.owner.login,
      avatarUrl: repoInfo.owner.avatar_url
    },
    contributions: {
      issues: 0,
      pullRequests: 0,
      additions,
      deletions,
      lastContributionDate
    }
  }
}
