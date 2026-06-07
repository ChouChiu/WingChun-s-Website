"use client"

import { List } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { extractHeadings, type TocItem } from "../lib/toc"

interface TableOfContentsProps {
  content: string
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [headings] = useState<TocItem[]>(() => extractHeadings(content))
  const [activeId, setActiveId] = useState<string>("")
  const listRef = useRef<HTMLUListElement>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: "-80px 0px -80% 0px" }
    )

    const headingElements = document.querySelectorAll(
      ".markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6"
    )

    headingElements.forEach((element) => {
      if (element.id) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!listRef.current || !indicatorRef.current) return

    const activeLink = listRef.current.querySelector(
      `a[href="#${activeId}"]`
    ) as HTMLElement | null

    if (activeLink) {
      const listRect = listRef.current.getBoundingClientRect()
      const linkRect = activeLink.getBoundingClientRect()
      const top = linkRect.top - listRect.top + listRef.current.scrollTop

      indicatorRef.current.style.top = `${top}px`
      indicatorRef.current.style.height = `${linkRect.height}px`
      indicatorRef.current.style.opacity = "1"
    } else {
      indicatorRef.current.style.opacity = "0"
    }
  }, [activeId])

  if (headings.length === 0) {
    return null
  }

  return (
    <nav className="toc">
      <div className="mb-3 flex items-center gap-2 font-semibold text-foreground text-sm">
        <List className="size-4" />
        <span>On This Page</span>
      </div>
      <div className="relative">
        <div
          ref={indicatorRef}
          className="absolute left-0 w-0.5 rounded-full bg-primary transition-all duration-200 ease-in-out"
          style={{ opacity: 0 }}
        />
        <ul ref={listRef} className="space-y-1.5 pl-3 text-sm">
          {headings.map((heading) => (
            <li
              key={heading.id}
              style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
            >
              <a
                href={`#${heading.id}`}
                className={`block py-0.5 transition-colors hover:text-foreground ${
                  activeId === heading.id
                    ? "font-medium text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
