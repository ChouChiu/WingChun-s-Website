export interface ContributionData {
  repo: string
  repoUrl: string
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
}

export interface GitHubContributionCardProps {
  repo: string
  className?: string
}
