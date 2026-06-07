import { NextResponse } from "next/server"

const GITHUB_API = "https://api.github.com"

interface ContributionData {
  repo: string
  stars: number
  openIssues: number
  pullRequests: number
  additions: number
  deletions: number
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await params
  const token = process.env.GITHUB_TOKEN

  try {
    const repoRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
      headers: token ? { Authorization: `token ${token}` } : {},
    })

    if (!repoRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch repo data" },
        { status: repoRes.status }
      )
    }

    const repoData = await repoRes.json()

    const prRes = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/pulls?state=all&per_page=1`,
      {
        headers: token ? { Authorization: `token ${token}` } : {},
      }
    )

    let pullRequests = 0
    if (prRes.ok) {
      const linkHeader = prRes.headers.get("link")
      if (linkHeader) {
        const match = linkHeader.match(/page=(\d+)>; rel="last"/)
        if (match) pullRequests = parseInt(match[1], 10)
      }
    }

    const data: ContributionData = {
      repo: `${owner}/${repo}`,
      stars: repoData.stargazers_count || 0,
      openIssues: repoData.open_issues_count || 0,
      pullRequests,
      additions: 0,
      deletions: 0,
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch contributions" },
      { status: 500 }
    )
  }
}
