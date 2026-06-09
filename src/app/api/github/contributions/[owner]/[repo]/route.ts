import { NextResponse } from "next/server"

const GITHUB_API = "https://api.github.com"
const USERNAME = "ChouChiu"

interface GitHubRepo {
  name: string
  full_name: string
  html_url: string
  description: string | null
  stargazers_count: number
  open_issues_count: number
  owner: {
    login: string
    avatar_url: string
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

async function fetchGitHub<T>(endpoint: string, token?: string): Promise<T> {
  const res = await fetch(`${GITHUB_API}${endpoint}`, {
    headers: token ? { Authorization: `token ${token}` } : {},
  })
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`)
  }
  return res.json()
}

async function searchIssues(
  owner: string,
  repo: string,
  username: string,
  type: "issue" | "pr",
  token?: string
): Promise<SearchResult> {
  try {
    const query = `repo:${owner}/${repo}+author:${username}+type:${type}`
    return await fetchGitHub<SearchResult>(`/search/issues?q=${query}`, token)
  } catch {
    return { total_count: 0, items: [] }
  }
}

async function getPullRequestStats(
  owner: string,
  repo: string,
  prNumbers: number[],
  token?: string
): Promise<{
  additions: number
  deletions: number
  lastMergedDate: string | null
}> {
  let additions = 0
  let deletions = 0
  let lastMergedDate: string | null = null

  for (const prNumber of prNumbers.slice(0, 10)) {
    try {
      const pr = await fetchGitHub<PullRequestDetail>(
        `/repos/${owner}/${repo}/pulls/${prNumber}`,
        token
      )
      additions += pr.additions
      deletions += pr.deletions
      if (pr.merged_at) {
        const mergedDate = pr.merged_at.split("T")[0]
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await params
  const token = process.env.GITHUB_TOKEN

  try {
    const [repoInfo, issuesResult, prsResult] = await Promise.all([
      fetchGitHub<GitHubRepo>(`/repos/${owner}/${repo}`, token),
      searchIssues(owner, repo, USERNAME, "issue", token),
      searchIssues(owner, repo, USERNAME, "pr", token),
    ])

    const prNumbers = prsResult.items.map((pr) => pr.number)
    const prStats = await getPullRequestStats(owner, repo, prNumbers, token)

    const encodedUsername = encodeURIComponent(USERNAME)

    const data = {
      repo: repoInfo.full_name,
      repoUrl: repoInfo.html_url,
      description: repoInfo.description,
      stars: repoInfo.stargazers_count,
      owner: {
        login: repoInfo.owner.login,
        avatarUrl: repoInfo.owner.avatar_url,
      },
      contributions: {
        issues: issuesResult.total_count,
        pullRequests: prsResult.total_count,
        additions: prStats.additions,
        deletions: prStats.deletions,
        lastContributionDate: prStats.lastMergedDate,
      },
      links: {
        issues: `https://github.com/${owner}/${repo}/issues?q=is%3Aissue+author%3A${encodedUsername}`,
        pullRequests: `https://github.com/${owner}/${repo}/pulls?q=is%3Apr+author%3A${encodedUsername}`,
      },
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch contributions" },
      { status: 500 }
    )
  }
}
