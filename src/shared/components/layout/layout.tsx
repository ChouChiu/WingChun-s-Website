"use client"

import { usePathname } from "next/navigation"
import { BlogProvider } from "./blog-context"
import { LeftSidebar } from "./left-sidebar"
import { Navbar } from "./navbar"
import { RightSidebar } from "./right-sidebar"

function LayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const showRightSidebar = pathname === "/" || pathname.startsWith("/blog")

  return (
    <div className="min-h-screen">
      <Navbar />

      <div
        className={
          showRightSidebar
            ? "mx-auto grid max-w-[1440px] grid-cols-1 gap-6 px-4 lg:grid-cols-[280px_1fr] lg:px-6 xl:grid-cols-[280px_1fr_256px]"
            : "mx-auto grid max-w-[1440px] grid-cols-1 gap-6 px-4 lg:grid-cols-[280px_1fr] lg:px-6"
        }
      >
        <LeftSidebar />

        <main
          className="min-w-0 py-6"
          style={{ viewTransitionName: "main-content" }}
        >
          <div className="rounded-2xl border border-border/60 bg-card/50 p-6 shadow-sm sm:p-8">
            {children}
          </div>
        </main>

        {showRightSidebar && (
          <RightSidebar isBlogPost={pathname.startsWith("/blog/")} />
        )}
      </div>
    </div>
  )
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <BlogProvider>
      <LayoutInner>{children}</LayoutInner>
    </BlogProvider>
  )
}
