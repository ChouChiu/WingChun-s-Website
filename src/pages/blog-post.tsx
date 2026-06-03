import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { getPostById, type BlogPost } from "@/lib/blog"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { TableOfContents } from "@/components/table-of-contents"
import { countWords } from "@/lib/toc"
import { ArrowLeft, Calendar, FileText, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"

export function BlogPostPage() {
  const { id } = useParams()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    getPostById(id).then((p) => {
      if (!cancelled) {
        setPost(p ?? null)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto max-w-[860px] text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-[860px] text-center">
        <h1 className="mb-4 text-2xl font-bold">Post Not Found</h1>
        <Button asChild>
          <Link to="/blog">Back to Blog</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/blog">
          <ArrowLeft className="mr-1.5 size-4" />
          Back to Blog
        </Link>
      </Button>

      <div className="flex gap-8">
        <article className="min-w-0 flex-1">
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">
            {post.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5" />
              {post.date}
            </span>
            <span className="flex items-center gap-1">
              <Tag className="size-3.5" />
              {post.tags.join(", ")}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="size-3.5" />
              {countWords(post.content)} 字
            </span>
          </div>

          <div className="markdown-body mt-6">
            <MarkdownRenderer content={post.content} />
          </div>
        </article>

        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24">
            <TableOfContents content={post.content} />
          </div>
        </aside>
      </div>
    </div>
  )
}
