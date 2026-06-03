import { Button } from "@/components/ui/button"
import {
  Code,
  MessageCircle,
  Send,
  Mail,
  Copy,
  ExternalLink,
} from "lucide-react"
import { useState } from "react"

export function HomePage() {
  const [copied, setCopied] = useState(false)

  const copyQQ = async () => {
    try {
      await navigator.clipboard.writeText("2750821684")
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error("Failed to copy")
    }
  }

  return (
    <div className="mx-auto max-w-[860px]">
      {/* Hero */}
      <section className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          WingChunWong
        </h1>
        <p className="mt-1 text-muted-foreground">
          A student from Hong Kong
        </p>
      </section>

      {/* Info Cards */}
      <section className="mb-7 grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3.5 rounded-lg border border-border/60 bg-muted/30 p-4 transition-colors hover:border-border">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Code className="size-4" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground">
              Current Projects
            </span>
            <span className="text-sm leading-relaxed">
              Building{" "}
              <a
                href="https://github.com/WingChunWong"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                My Website
              </a>{" "}
              and other open-source projects
            </span>
          </div>
        </div>
        <div className="flex items-start gap-3.5 rounded-lg border border-border/60 bg-muted/30 p-4 transition-colors hover:border-border">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
            <MessageCircle className="size-4" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground">
              Interests
            </span>
            <span className="text-sm leading-relaxed">
              Vibe Coding &amp; Play Games
            </span>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="mb-7">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          Contact
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://t.me/wingchunwong111"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Send className="mr-1.5 size-4" />
              Telegram
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="mailto:lshengevery@gmail.com">
              <Mail className="mr-1.5 size-4" />
              Gmail
            </a>
          </Button>
          <Button variant="outline" size="sm" onClick={copyQQ}>
            <Copy className="mr-1.5 size-4" />
            {copied ? "Copied!" : "QQ: 2750821684"}
          </Button>
        </div>
      </section>

      {/* Quick Links */}
      <section className="mt-7">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          Quick Links
        </h2>
        <div className="grid gap-2 sm:grid-cols-3">
          <Button variant="secondary" asChild>
            <a
              href="https://github.com/WingChunWong"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-1.5 size-4" />
              GitHub Profile
            </a>
          </Button>
          <Button variant="secondary" asChild>
            <a href="/blog">Read My Blog</a>
          </Button>
          <Button variant="secondary" asChild>
            <a href="/tools">Try My Tools</a>
          </Button>
        </div>
      </section>
    </div>
  )
}
