const GITHUB_API = "https://api.github.com"
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ""

export async function fetchGitHub<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "GitHub-Contribution-API",
  }

  if (GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`
  }

  const response = await fetch(`${GITHUB_API}${endpoint}`, {
    headers,
    ...options,
  })

  if (!response.ok) {
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}`
    )
  }

  return response.json() as Promise<T>
}
