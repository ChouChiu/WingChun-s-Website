"use client"

import { MarkdownRenderer as BaseMarkdownRenderer } from "@chouchiu/markdown"
import "@chouchiu/markdown/styles.css"
import type { Components, ExtraProps } from "react-markdown"
import { GitHubContributionCard } from "@/features/github/components/contribution-card"

import "katex/dist/katex.min.css"

function stripNode<T extends Record<string, unknown>>(
  props: T
): Omit<T, "node"> {
  const { node, ...rest } = props
  return rest as Omit<T, "node">
}

const customComponents: Components = {
  div({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & ExtraProps) {
    const cleanProps = stripNode(props) as Record<string, unknown>
    const repos = cleanProps["data-github-contribution"] as string | undefined
    if (repos) {
      const repoList = repos
        .split("|")
        .map((r) => r.trim())
        .filter(Boolean)
      return (
        <div className="flex flex-col gap-4">
          {repoList.map((repo) => (
            <GitHubContributionCard key={repo} repo={repo} />
          ))}
        </div>
      )
    }
    return <div {...cleanProps}>{children}</div>
  },
}

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <BaseMarkdownRenderer content={content} components={customComponents} />
  )
}
