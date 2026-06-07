"use client"

import { usePathname } from "next/navigation"
import { TableOfContents } from "../../../features/blog/components/table-of-contents"
import { useBlogContext } from "./blog-context"
import { SidebarWidgets } from "./sidebar-widgets"

interface RightSidebarProps {
  isBlogPost: boolean
}

function TocSkeleton() {
  return (
    <div className="space-y-3 px-1">
      <div className="h-4 w-16 animate-pulse rounded bg-muted" />
      <div className="space-y-2">
        <div className="h-3 w-28 animate-pulse rounded bg-muted/60" />
        <div className="h-3 w-20 animate-pulse rounded bg-muted/60" />
        <div className="h-3 w-24 animate-pulse rounded bg-muted/60" />
        <div className="h-3 w-16 animate-pulse rounded bg-muted/60" />
      </div>
    </div>
  )
}

export function RightSidebar({ isBlogPost }: RightSidebarProps) {
  const { tocContent, tocLoading } = useBlogContext()
  const pathname = usePathname()

  return (
    <aside
      className="hidden py-6 xl:block"
      style={{ viewTransitionName: "right-sidebar" }}
    >
      <div className="sticky top-20 animate-slide-in-right">
        {isBlogPost && tocLoading ? (
          <TocSkeleton />
        ) : isBlogPost && tocContent ? (
          <div key={`toc-${pathname}`} className="animate-content-switch">
            <TableOfContents content={tocContent} />
          </div>
        ) : (
          <div key={`widgets-${pathname}`} className="animate-content-switch">
            <SidebarWidgets />
          </div>
        )}
      </div>
    </aside>
  )
}
