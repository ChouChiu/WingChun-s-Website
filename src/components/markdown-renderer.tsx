import { useMemo, useState, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkEmoji from "remark-emoji"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"
import { rehypeGithubAlerts } from "rehype-github-alerts"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { nightOwl } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Icon } from "@iconify/react"
import { Check, Copy } from "lucide-react"
import type { Components, ExtraProps } from "react-markdown"
import { slugify } from "@/lib/toc"

import "katex/dist/katex.min.css"

function stripNode<T extends Record<string, unknown>>(props: T): Omit<T, "node"> {
  const { node: _node, ...rest } = props
  return rest as Omit<T, "node">
}

function extractText(children: React.ReactNode): string {
  if (typeof children === "string") return children
  if (typeof children === "number") return String(children)
  if (Array.isArray(children)) return children.map(extractText).join("")
  if (children && typeof children === "object" && "props" in children) {
    const element = children as { props: { children?: React.ReactNode } }
    return extractText(element.props.children)
  }
  return ""
}

function CodeBlock({ language, codeString }: { language: string; codeString: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(codeString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [codeString])

  return (
    <div className="markdown-code-block">
      <div className="markdown-code-header">
        <div className="flex items-center gap-2">
          <Icon icon={`devicon:${language}`} className="markdown-code-icon" />
          <span>{language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? (
            <>
              <Check className="size-3" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="size-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={nightOwl}
        customStyle={{
          margin: 0,
          borderRadius: "0 0 var(--radius) var(--radius)",
          fontSize: "0.875rem",
        }}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  )
}

const markdownComponents: Components = {
  h1({ children, ...props }) {
    const cleanProps = stripNode(props)
    const text = extractText(children)
    const id = slugify(text)
    return <h1 id={id} {...cleanProps}>{children}</h1>
  },
  h2({ children, ...props }) {
    const cleanProps = stripNode(props)
    const text = extractText(children)
    const id = slugify(text)
    return <h2 id={id} {...cleanProps}>{children}</h2>
  },
  h3({ children, ...props }) {
    const cleanProps = stripNode(props)
    const text = extractText(children)
    const id = slugify(text)
    return <h3 id={id} {...cleanProps}>{children}</h3>
  },
  h4({ children, ...props }) {
    const cleanProps = stripNode(props)
    const text = extractText(children)
    const id = slugify(text)
    return <h4 id={id} {...cleanProps}>{children}</h4>
  },
  h5({ children, ...props }) {
    const cleanProps = stripNode(props)
    const text = extractText(children)
    const id = slugify(text)
    return <h5 id={id} {...cleanProps}>{children}</h5>
  },
  h6({ children, ...props }) {
    const cleanProps = stripNode(props)
    const text = extractText(children)
    const id = slugify(text)
    return <h6 id={id} {...cleanProps}>{children}</h6>
  },
  pre({ children }) {
    return <>{children}</>
  },
  code({ className, children, ...props }: React.HTMLAttributes<HTMLElement> & ExtraProps) {
    const cleanProps = stripNode(props)
    const match = /language-(\w+)/.exec(className || "")
    const language = match ? match[1] : ""
    const codeString = String(children).replace(/\n$/, "")

    if (match) {
      return <CodeBlock language={language} codeString={codeString} />
    }

    return (
      <code className={className} {...cleanProps}>
        {children}
      </code>
    )
  },
  table({ children }) {
    return (
      <div className="overflow-x-auto rounded-lg">
        <table>{children}</table>
      </div>
    )
  },
  a({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & ExtraProps) {
    const cleanProps = stripNode(props)
    const isExternal = href?.startsWith("http")
    return (
      <a
        href={href}
        {...(isExternal
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
        {...cleanProps}
      >
        {children}
      </a>
    )
  },
  input({ checked, ...props }: React.InputHTMLAttributes<HTMLInputElement> & ExtraProps) {
    const cleanProps = stripNode(props)
    return (
      <input
        type="checkbox"
        checked={checked}
        readOnly
        className="markdown-checkbox"
        {...cleanProps}
      />
    )
  },
}

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const remarkPlugins = useMemo(() => [remarkGfm, remarkEmoji, remarkMath], [])
  const rehypePlugins = useMemo(
    () => [rehypeRaw, rehypeKatex, rehypeGithubAlerts],
    [],
  )

  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      components={markdownComponents}
    >
      {content}
    </ReactMarkdown>
  )
}
