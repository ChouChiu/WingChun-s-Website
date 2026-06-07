"use client"

import { Clock, FolderOpen, Tag } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Badge } from "../ui/badge"
import { Separator } from "../ui/separator"

interface BlogMeta {
  id: string
  title: string
  date: string
  summary: string
  cag: string
  tags: string[]
}

function CategoriesWidget({ posts }: { posts: BlogMeta[] }) {
  const cagCounts = new Map<string, number>()
  for (const post of posts) {
    if (post.cag) {
      cagCounts.set(post.cag, (cagCounts.get(post.cag) ?? 0) + 1)
    }
  }

  if (cagCounts.size === 0) return null

  return (
    <div className="">
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground text-sm">
        <FolderOpen className="size-4" />
        分類
      </h3>
      <div className="flex flex-col gap-1">
        {Array.from(cagCounts.entries()).map(([cag, count]) => (
          <Link
            key={cag}
            href={`/blog?cag=${encodeURIComponent(cag)}`}
            className="flex items-center justify-between rounded-md px-2 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
          >
            <span>{cag}</span>
            <Badge variant="secondary" className="text-xs">
              {count}
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  )
}

function TagsWidget({ posts }: { posts: BlogMeta[] }) {
  const tagSet = new Set<string>()
  for (const post of posts) {
    for (const tag of post.tags) {
      tagSet.add(tag)
    }
  }

  if (tagSet.size === 0) return null

  return (
    <div className="">
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground text-sm">
        <Tag className="size-4" />
        標籤
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {Array.from(tagSet).map((tag) => (
          <Badge key={tag} variant="outline" asChild>
            <Link href={`/blog?tag=${encodeURIComponent(tag)}`}>{tag}</Link>
          </Badge>
        ))}
      </div>
    </div>
  )
}

function RecentPostsWidget({ posts }: { posts: BlogMeta[] }) {
  const recent = posts.slice(0, 5)

  if (recent.length === 0) return null

  return (
    <div className="">
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground text-sm">
        <Clock className="size-4" />
        最近文章
      </h3>
      <div className="flex flex-col gap-1">
        {recent.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.id}`}
            className="group rounded-md px-2 py-1.5 transition-colors hover:bg-muted"
          >
            <p className="text-muted-foreground text-sm leading-snug group-hover:text-foreground">
              {post.title}
            </p>
            <p className="mt-0.5 text-muted-foreground/60 text-xs">
              {post.date}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function SidebarWidgets() {
  const [posts, setPosts] = useState<BlogMeta[]>([])

  useEffect(() => {
    fetch("/api/blog")
      .then((res) => res.json())
      .then((data: BlogMeta[]) => setPosts(data))
      .catch(() => {
        /* ignore fetch errors */
      })
  }, [])

  if (posts.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      <CategoriesWidget posts={posts} />
      <Separator />
      <TagsWidget posts={posts} />
      <Separator />
      <RecentPostsWidget posts={posts} />
    </div>
  )
}
