import { useEffect, useState } from 'react'
import { Star, Plus, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchContributionData } from '@/lib/github'
import type { ContributionData, GitHubContributionCardProps } from '@/types/github'

export function GitHubContributionCard({ repo, className }: GitHubContributionCardProps) {
  const [data, setData] = useState<ContributionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const result = await fetchContributionData(repo)
        if (!cancelled) {
          setData(result)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load data')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [repo])

  if (loading) {
    return (
      <div className={cn(
        'flex flex-col sm:flex-row gap-4 rounded-lg border border-border/60 bg-muted/30 p-4',
        'animate-pulse',
        className
      )}>
        <div className="flex-1 space-y-3">
          <div className="h-5 w-32 bg-muted rounded" />
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
        <div className="flex-1 grid grid-cols-2 gap-2">
          <div className="h-16 bg-muted rounded" />
          <div className="h-16 bg-muted rounded" />
          <div className="h-16 bg-muted rounded" />
          <div className="h-16 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn(
        'flex flex-col sm:flex-row gap-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4',
        className
      )}>
        <div className="flex-1">
          <p className="text-sm text-destructive">Failed to load contribution data</p>
          <p className="text-xs text-muted-foreground mt-1">{repo}</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  return (
    <div className={cn(
      'flex flex-col sm:flex-row gap-4 rounded-lg border border-border/60 bg-muted/30 p-4 transition-colors hover:border-border',
      className
    )}>
      {/* Left: Repo info */}
      <div className="flex-1">
        <a
          href={data.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-primary hover:underline"
        >
          {data.repo}
        </a>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="size-3 fill-current" />
          <span>{formatNumber(data.stars)}</span>
        </div>
      </div>

      {/* Right: Contributions */}
      <div className="flex-1 grid grid-cols-2 gap-2">
        <div className="flex flex-col items-center justify-center rounded-md bg-background/50 p-2">
          <span className="text-lg font-bold text-foreground">
            {data.contributions.issues}
          </span>
          <span className="text-xs text-muted-foreground">Issues</span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-md bg-background/50 p-2">
          <span className="text-lg font-bold text-foreground">
            {data.contributions.pullRequests}
          </span>
          <span className="text-xs text-muted-foreground">PRs</span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-md bg-background/50 p-2">
          <div className="flex items-center gap-1">
            <Plus className="size-3 text-green-500" />
            <span className="text-lg font-bold text-green-600 dark:text-green-400">
              {formatNumber(data.contributions.additions)}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">Additions</span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-md bg-background/50 p-2">
          <div className="flex items-center gap-1">
            <Minus className="size-3 text-red-500" />
            <span className="text-lg font-bold text-red-600 dark:text-red-400">
              {formatNumber(data.contributions.deletions)}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">Deletions</span>
        </div>
      </div>
    </div>
  )
}
