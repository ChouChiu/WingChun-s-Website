import { ArrowLeft, Calendar, FileText, FolderOpen, Tag } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useBlogContext } from "@/shared/components/layout/blog-context"
import { Button } from "@/shared/components/ui/button"
import { GiscusComments } from "../components/giscus-comments"
import { MarkdownRenderer } from "../components/markdown-renderer"
import { type BlogPost, getPostById } from "../lib/blog"
import { countWords } from "../lib/toc"

export function BlogPostPage() {
  const { id } = useParams()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const { setTocContent, setTocLoading, tocCache } = useBlogContext()

  useEffect(() => {
    if (!id) return
    let cancelled = false

    if (tocCache.has(id)) {
      setTocContent(tocCache.get(id)!)
      setTocLoading(false)
    } else {
      setTocLoading(true)
    }

    getPostById(id).then((p) => {
      if (!cancelled) {
        setPost(p ?? null)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [id, setTocLoading, setTocContent, tocCache])

  useEffect(() => {
    if (post) {
      if (!tocCache.has(post.id)) {
        tocCache.set(post.id, post.content)
      }
      setTocContent(post.content)
      setTocLoading(false)
    }
  }, [post, setTocContent, setTocLoading, tocCache])

  if (loading) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">載入中...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="text-center">
        <h1 className="mb-4 font-bold text-2xl">找不到文章</h1>
        <Button asChild>
          <Link to="/blog">返回網誌</Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="stagger-1 mb-4 animate-fade-in-up"
      >
        <Link to="/blog">
          <ArrowLeft className="mr-1.5 size-4" />
          返回網誌
        </Link>
      </Button>

      <article>
        <h1 className="stagger-2 animate-fade-in-up font-bold font-heading text-2xl sm:text-3xl">
          {post.title}
        </h1>
        <div className="stagger-3 mt-2 flex animate-fade-in-up flex-wrap items-center gap-3 text-muted-foreground text-sm">
          <span className="flex items-center gap-1">
            <Calendar className="size-3.5" />
            {post.date}
          </span>
          {post.cag && (
            <Link
              to={`/blog?cag=${encodeURIComponent(post.cag)}`}
              className="flex items-center gap-1 transition-colors hover:text-foreground"
            >
              <FolderOpen className="size-3.5" />
              {post.cag}
            </Link>
          )}
          <span className="flex items-center gap-1">
            <Tag className="size-3.5" />
            {post.tags.join(", ")}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="size-3.5" />
            {countWords(post.content)} 字
          </span>
        </div>

        <div className="markdown-body stagger-4 mt-6 animate-fade-in-up">
          <MarkdownRenderer content={post.content} />
        </div>
      </article>

      <hr className="stagger-4 my-8 animate-fade-in-up" />

      <section className="stagger-5 animate-fade-in-up">
        <h2 className="mb-6 font-heading font-semibold text-xl">留言區</h2>
        <GiscusComments />
      </section>
    </div>
  )
}
