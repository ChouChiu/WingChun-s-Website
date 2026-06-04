import { Button } from "@/shared/components/ui/button"
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
      <section className="animate-fade-in-up stagger-1 mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          ChouChiu
        </h1>
        <p className="mt-1 text-muted-foreground">
          來自香港的學生
        </p>
      </section>

      {/* Info Cards */}
      <section className="mb-7 grid gap-3 sm:grid-cols-2">
        <div className="animate-fade-in-up stagger-2 flex items-start gap-3.5 rounded-lg border border-border/60 bg-muted/30 p-4 transition-colors hover:border-border">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Code className="size-4" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground">
              現時項目
            </span>
            <span className="text-sm leading-relaxed">
              正在建構{" "}
              <a
                href="https://github.com/ChouChiu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                我的網站
              </a>{" "}
              及其他開源項目
            </span>
          </div>
        </div>
        <div className="animate-fade-in-up stagger-3 flex items-start gap-3.5 rounded-lg border border-border/60 bg-muted/30 p-4 transition-colors hover:border-border">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
            <MessageCircle className="size-4" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground">
              興趣
            </span>
            <span className="text-sm leading-relaxed">
              Vibe Coding &amp; 打機
            </span>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="animate-fade-in-up stagger-4 mb-7">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          聯絡方式
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
            {copied ? "已複製！" : "QQ: 2750821684"}
          </Button>
        </div>
      </section>

      {/* Quick Links */}
      <section className="animate-fade-in-up stagger-5 mt-7">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          快速連結
        </h2>
        <div className="grid gap-2 sm:grid-cols-3">
          <Button variant="secondary" asChild>
            <a
              href="https://github.com/ChouChiu"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-1.5 size-4" />
              GitHub 個人資料
            </a>
          </Button>
          <Button variant="secondary" asChild>
            <a href="/blog">閱讀我的網誌</a>
          </Button>
          <Button variant="secondary" asChild>
            <a href="/math-game">試試我的數學遊戲</a>
          </Button>
        </div>
      </section>
    </div>
  )
}
