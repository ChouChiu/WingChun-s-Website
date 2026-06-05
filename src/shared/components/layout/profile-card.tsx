import { Copy, ExternalLink, Mail, Send } from "lucide-react"
import { useState } from "react"
import { GithubIcon } from "../icons/github-icon"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { Button } from "../ui/button"
import { Separator } from "../ui/separator"

export function ProfileCard() {
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
    <div className="flex flex-col items-start gap-4 rounded-2xl border border-border/60 bg-card/50 p-5 shadow-sm">
      {/* Avatar & Info */}
      <div className="flex items-center gap-3">
        <Avatar size="lg">
          <AvatarFallback>CC</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-bold font-heading text-lg">ChouChiu</h2>
          <p className="mt-0.5 text-muted-foreground text-sm">來自香港的學生</p>
        </div>
      </div>

      <Separator />

      {/* Interests */}
      <div className="w-full">
        <p className="mb-2 font-semibold text-muted-foreground text-xs">興趣</p>
        <p className="text-sm leading-relaxed">Vibe Coding &amp; 打機</p>
      </div>

      <Separator />

      {/* Projects */}
      <div className="w-full">
        <p className="mb-2 font-semibold text-muted-foreground text-xs">
          現時項目
        </p>
        <p className="text-sm leading-relaxed">
          <a
            href="/blog/contributions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            點擊查看
          </a>
        </p>
      </div>

      <Separator />

      {/* Social Links */}
      <div className="w-full">
        <p className="mb-2 font-semibold text-muted-foreground text-xs">
          聯絡方式
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://t.me/wingchunwong111"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Send className="mr-1 size-3.5" />
              Telegram
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="mailto:lshengevery@gmail.com">
              <Mail className="mr-1 size-3.5" />
              Gmail
            </a>
          </Button>
          <Button variant="outline" size="sm" onClick={copyQQ}>
            <Copy className="mr-1 size-3.5" />
            {copied ? "已複製！" : "2750821684"}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Quick Links */}
      <div className="flex w-full flex-col gap-1.5">
        <Button variant="secondary" size="sm" asChild className="w-full">
          <a
            href="https://github.com/ChouChiu"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GithubIcon className="mr-1.5 size-4" />
            GitHub
            <ExternalLink className="ml-auto size-3 opacity-50" />
          </a>
        </Button>
      </div>
    </div>
  )
}
