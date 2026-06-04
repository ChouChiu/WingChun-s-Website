import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getAllPosts, type BlogPost } from "../lib/blog"
import { Calendar, Tag } from "lucide-react"

export function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])

  useEffect(() => {
    getAllPosts().then(setPosts)
  }, [])

  return (
    <div className="mx-auto max-w-[860px]">
      <h1 className="animate-fade-in-up stagger-1 mb-6 font-heading text-2xl font-bold">網誌</h1>
      <div className="flex flex-col gap-4">
        {posts.map((post, idx) => (
          <Link
            key={post.id}
            to={`/blog/${post.id}`}
            className="animate-fade-in-up group rounded-lg border border-border/60 bg-muted/30 p-5 transition-all duration-200 hover:border-border hover:bg-muted/50"
            style={{ animationDelay: `${150 + idx * 80}ms` }}
          >
            <h2 className="text-lg font-semibold group-hover:text-primary">
              {post.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {post.summary}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                {post.date}
              </span>
              <span className="flex items-center gap-1">
                <Tag className="size-3" />
                {post.tags.join(", ")}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
