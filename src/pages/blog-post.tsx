import { useParams, Link } from "react-router-dom"
import { blogPosts } from "@/data/blog-posts"
import { ArrowLeft, Calendar, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"

export function BlogPostPage() {
  const { id } = useParams()
  const post = blogPosts.find((p) => p.id === id)

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
    <div className="mx-auto max-w-[860px]">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/blog">
          <ArrowLeft className="mr-1.5 size-4" />
          Back to Blog
        </Link>
      </Button>

      <article>
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
        </div>

        <div className="prose prose-sm dark:prose-invert mt-6 max-w-none">
          {post.content.split("\n").map((line, i) => {
            if (line.startsWith("# ")) {
              return (
                <h1
                  key={i}
                  className="mb-4 mt-8 font-heading text-2xl font-bold"
                >
                  {line.slice(2)}
                </h1>
              )
            }
            if (line.startsWith("## ")) {
              return (
                <h2
                  key={i}
                  className="mb-3 mt-6 font-heading text-xl font-semibold"
                >
                  {line.slice(3)}
                </h2>
              )
            }
            if (line.startsWith("```")) {
              return null
            }
            if (line.startsWith("- ")) {
              return (
                <li key={i} className="ml-4 list-disc text-muted-foreground">
                  {renderInline(line.slice(2))}
                </li>
              )
            }
            if (/^\d+\.\s/.test(line)) {
              return (
                <li
                  key={i}
                  className="ml-4 list-decimal text-muted-foreground"
                >
                  {renderInline(line.replace(/^\d+\.\s/, ""))}
                </li>
              )
            }
            if (line.trim() === "") {
              return <br key={i} />
            }
            return (
              <p key={i} className="mb-2 leading-relaxed text-foreground/90">
                {renderInline(line)}
              </p>
            )
          })}
        </div>
      </article>
    </div>
  )
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })
}
