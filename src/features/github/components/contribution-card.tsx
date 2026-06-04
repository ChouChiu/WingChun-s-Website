import { useEffect, useState } from 'react'
import { Star, GitPullRequest, CircleDot, Plus, Minus, GitCommit } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { fetchContributionData } from '../lib/github'
import type { ContributionData, GitHubContributionCardProps } from '../types/github'

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

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
        'rounded-xl border border-border/60 bg-muted/30 p-5 transition-all duration-200',
        'animate-pulse',
        className
      )}>
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <div className="size-5 bg-muted-foreground/20 rounded" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-5 w-40 bg-muted rounded" />
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-3 w-56 bg-muted rounded" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="h-20 bg-muted rounded-lg" />
          <div className="h-20 bg-muted rounded-lg" />
          <div className="h-20 bg-muted rounded-lg" />
          <div className="h-20 bg-muted rounded-lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn(
        'rounded-xl border border-destructive/30 bg-destructive/10 p-5',
        className
      )}>
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/20">
            <GithubIcon className="size-5 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-medium text-destructive">Failed to load</p>
            <p className="text-xs text-muted-foreground mt-0.5">{repo}</p>
          </div>
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
      'group rounded-xl border border-border/60 bg-muted/30 p-5 transition-all duration-200',
      'hover:border-border hover:bg-muted/40 hover:shadow-sm',
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary transition-colors group-hover:bg-primary/20">
          <GithubIcon className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <a
            href={data.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
          >
            {data.repo}
          </a>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="size-3.5 fill-yellow-500 text-yellow-500" />
              {formatNumber(data.stars)}
            </span>
            {data.contributions.lastContributionDate && (
              <span className="flex items-center gap-1">
                <GitCommit className="size-3.5" />
                My last: {data.contributions.lastContributionDate}
              </span>
            )}
          </div>
          {data.description && (
            <p className="mt-1.5 text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
              {data.description}
            </p>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {/* Issues */}
        <a
          href={data.links.issues}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center rounded-lg border border-border/40 bg-background/60 p-3 transition-all hover:border-violet-500/40 hover:bg-violet-500/5 group/stat"
          style={{ textDecoration: 'none' }}
        >
          <div className="flex items-center gap-1.5">
            <CircleDot className="size-4 text-violet-500 transition-transform group-hover/stat:scale-110" />
            <span className="text-xl font-bold text-foreground group-hover/stat:text-violet-600 dark:group-hover/stat:text-violet-400">
              {data.contributions.issues}
            </span>
          </div>
          <span className="mt-1 text-xs text-muted-foreground">Issues</span>
        </a>

        {/* PRs */}
        <a
          href={data.links.pullRequests}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center rounded-lg border border-border/40 bg-background/60 p-3 transition-all hover:border-blue-500/40 hover:bg-blue-500/5 group/stat"
          style={{ textDecoration: 'none' }}
        >
          <div className="flex items-center gap-1.5">
            <GitPullRequest className="size-4 text-blue-500 transition-transform group-hover/stat:scale-110" />
            <span className="text-xl font-bold text-foreground group-hover/stat:text-blue-600 dark:group-hover/stat:text-blue-400">
              {data.contributions.pullRequests}
            </span>
          </div>
          <span className="mt-1 text-xs text-muted-foreground">PRs</span>
        </a>

        {/* Additions */}
        <div className="flex flex-col items-center justify-center rounded-lg border border-border/40 bg-background/60 p-3 transition-colors hover:border-green-500/30">
          <div className="flex items-center gap-1.5">
            <Plus className="size-4 text-green-500" />
            <span className="text-xl font-bold text-green-600 dark:text-green-400">
              {formatNumber(data.contributions.additions)}
            </span>
          </div>
          <span className="mt-1 text-xs text-muted-foreground">Additions</span>
        </div>

        {/* Deletions */}
        <div className="flex flex-col items-center justify-center rounded-lg border border-border/40 bg-background/60 p-3 transition-colors hover:border-red-500/30">
          <div className="flex items-center gap-1.5">
            <Minus className="size-4 text-red-500" />
            <span className="text-xl font-bold text-red-600 dark:text-red-400">
              {formatNumber(data.contributions.deletions)}
            </span>
          </div>
          <span className="mt-1 text-xs text-muted-foreground">Deletions</span>
        </div>
      </div>
    </div>
  )
}
