import { Calendar, FolderOpen, Tag, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Button } from "@/shared/components/ui/button"
import { type BlogPost, getAllPosts } from "../lib/blog"

export function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCag = searchParams.get("cag")
  const activeTag = searchParams.get("tag")

  useEffect(() => {
    getAllPosts().then(setPosts)
  }, [])

  const filtered = useMemo(() => {
    if (activeCag) return posts.filter((p) => p.cag === activeCag)
    if (activeTag) return posts.filter((p) => p.tags.includes(activeTag))
    return posts
  }, [posts, activeCag, activeTag])

  const clearFilter = () => {
    setSearchParams({})
  }

  return (
    <div>
      <div className="stagger-1 mb-6 flex animate-fade-in-up items-center gap-3">
        <h1 className="font-bold font-heading text-2xl">網誌</h1>
        {(activeCag || activeTag) && (
          <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-primary text-sm">
            {activeCag ? (
              <FolderOpen className="size-3" />
            ) : (
              <Tag className="size-3" />
            )}
            {activeCag ?? activeTag}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={clearFilter}
              className="ml-0.5 size-4 rounded-full"
            >
              <X className="size-3" />
            </Button>
          </span>
        )}
      </div>
      <div className="flex flex-col gap-4">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {activeCag
              ? `沒有「${activeCag}」分類的文章`
              : activeTag
                ? `沒有「${activeTag}」標籤的文章`
                : "暫無文章"}
          </p>
        ) : (
          filtered.map((post, idx) => (
            <Link
              key={post.id}
              to={`/blog/${post.id}`}
              className="group animate-fade-in-up rounded-lg border border-border/60 bg-muted/30 p-5 transition-all duration-200 hover:border-border hover:bg-muted/50"
              style={{ animationDelay: `${150 + idx * 80}ms` }}
            >
              <h2 className="font-semibold text-lg group-hover:text-primary">
                {post.title}
              </h2>
              <p className="mt-1 text-muted-foreground text-sm">
                {post.summary}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-muted-foreground text-xs">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {post.date}
                </span>
                {post.cag && (
                  <span className="flex items-center gap-1">
                    <FolderOpen className="size-3" />
                    {post.cag}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Tag className="size-3" />
                  {post.tags.join(", ")}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
