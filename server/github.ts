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

interface SearchResult {
  total_count: number
  items: Array<{
    number: number
    created_at: string
  }>
}

interface PullRequestDetail {
  additions: number
  deletions: number
  merged_at: string | null
}

async function searchIssues(owner: string, repo: string, username: string, type: 'issue' | 'pr'): Promise<SearchResult> {
  try {
    const query = `repo:${owner}/${repo}+author:${username}+type:${type}`
    return await fetchGitHub<SearchResult>(`/search/issues?q=${query}`)
  } catch {
    return { total_count: 0, items: [] }
  }
}

async function getPullRequestStats(owner: string, repo: string, prNumbers: number[]): Promise<{ additions: number, deletions: number, lastMergedDate: string | null }> {
  let additions = 0
  let deletions = 0
  let lastMergedDate: string | null = null

  for (const prNumber of prNumbers.slice(0, 10)) {
    try {
      const pr = await fetchGitHub<PullRequestDetail>(`/repos/${owner}/${repo}/pulls/${prNumber}`)
      additions += pr.additions
      deletions += pr.deletions
      if (pr.merged_at) {
        const mergedDate = pr.merged_at.split('T')[0]
        if (!lastMergedDate || mergedDate > lastMergedDate) {
          lastMergedDate = mergedDate
        }
      }
    } catch {
      continue
    }
  }

  return { additions, deletions, lastMergedDate }
}

export async function getContributionData(owner: string, repo: string, username: string): Promise<ContributionData> {
  const [repoInfo, issuesResult, prsResult] = await Promise.all([
    getRepoInfo(owner, repo),
    searchIssues(owner, repo, username, 'issue'),
    searchIssues(owner, repo, username, 'pr')
  ])

  const prNumbers = prsResult.items.map(pr => pr.number)
  const prStats = await getPullRequestStats(owner, repo, prNumbers)

  const encodedUsername = encodeURIComponent(username)

  return {
    repo: repoInfo.full_name,
    repoUrl: repoInfo.html_url,
    description: repoInfo.description,
    stars: repoInfo.stargazers_count,
    owner: {
      login: repoInfo.owner.login,
      avatarUrl: repoInfo.owner.avatar_url
    },
    contributions: {
      issues: issuesResult.total_count,
      pullRequests: prsResult.total_count,
      additions: prStats.additions,
      deletions: prStats.deletions,
      lastContributionDate: prStats.lastMergedDate
    },
    links: {
      issues: `https://github.com/${owner}/${repo}/issues?q=is%3Aissue+author%3A${encodedUsername}`,
      pullRequests: `https://github.com/${owner}/${repo}/pulls?q=is%3Apr+author%3A${encodedUsername}`
    }
  }
}
