import { Calendar, Tag } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { type BlogPost, getAllPosts } from "@/features/blog/lib/blog"

export function HomePage() {
  const [posts, setPosts] = useState<BlogPost[]>([])

  useEffect(() => {
    getAllPosts().then(setPosts)
  }, [])

  return (
    <div>
      <h1 className="stagger-1 mb-6 animate-fade-in-up font-bold font-heading text-2xl">
        最近文章
      </h1>
      <div className="flex flex-col gap-4">
        {posts.length === 0 ? (
          <p className="text-muted-foreground text-sm">暫無文章</p>
        ) : (
          posts.map((post, idx) => (
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
