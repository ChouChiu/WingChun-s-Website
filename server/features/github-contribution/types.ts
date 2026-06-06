export interface GitHubRepo {
  name: string
  full_name: string
  html_url: string
  description: string | null
  stargazers_count: number
  owner: {
    login: string
    avatar_url: string
  }
}

export interface GitHubContributor {
  login: string
  contributions: number
}

export interface GitHubStats {
  total: number
  author: {
    login: string
  }
  weeks: Array<{
    w: string
    a: number
    d: number
    c: number
  }>
}

export interface ContributionData {
  repo: string
  repoUrl: string
  description: string | null
  stars: number
  owner: {
    login: string
    avatarUrl: string
  }
  contributions: {
    issues: number
    pullRequests: number
    additions: number
    deletions: number
    lastContributionDate: string | null
  }
  links: {
    issues: string
    pullRequests: string
  }
}

export interface CachedData {
  data: ContributionData
  timestamp: number
}
