import { Link, useLocation } from "react-router-dom"
import {
  Home,
  BookOpen,
  Wrench,
  ClipboardList,
  Menu,
  X,
} from "lucide-react"

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/blog", label: "Blog", icon: BookOpen },
  { href: "/hw-list", label: "HW List", icon: ClipboardList },
  { href: "/math-game", label: "Math Games", icon: Wrench },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/"
    return location.pathname.startsWith(href)
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-3 sm:px-6">
      {/* Header */}
      <header
        className={cn(
          "sticky top-3 z-50 mb-5 flex items-center gap-4 rounded-xl border border-border/60 bg-card/80 px-5 py-3",
          "shadow-lg backdrop-blur-xl transition-colors duration-200 hover:border-border"
        )}
      >
        <Link to="/" className="mr-3 shrink-0 font-heading text-lg font-bold tracking-tight">
          WingChun
        </Link>

        {/* Desktop nav */}
        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Button
              key={link.href}
              variant={isActive(link.href) ? "secondary" : "ghost"}
              size="sm"
              asChild
              className={cn(
                "relative",
                isActive(link.href) &&
                  "after:absolute after:bottom-0 after:left-1/2 after:h-[3px] after:w-4 after:-translate-x-1/2 after:rounded-full after:bg-primary"
              )}
            >
              <Link to={link.href}>
                <link.icon className="mr-1.5 size-4" />
                {link.label}
              </Link>
            </Button>
          ))}
          <div className="ml-auto">
            <Button variant="ghost" size="icon" asChild>
              <a
                href="https://github.com/WingChunWong"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GithubIcon className="size-5" />
              </a>
            </Button>
          </div>
        </nav>

        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </header>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="mb-4 flex flex-col gap-1 rounded-xl border border-border/60 bg-card/80 p-3 backdrop-blur-xl md:hidden">
          {navLinks.map((link) => (
            <Button
              key={link.href}
              variant={isActive(link.href) ? "secondary" : "ghost"}
              size="sm"
              asChild
              className="justify-start"
              onClick={() => setMobileOpen(false)}
            >
              <Link to={link.href}>
                <link.icon className="mr-2 size-4" />
                {link.label}
              </Link>
            </Button>
          ))}
          <Button variant="ghost" size="sm" asChild className="justify-start">
            <a
              href="https://github.com/WingChunWong"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GithubIcon className="mr-2 size-4" />
              GitHub
            </a>
          </Button>
        </nav>
      )}

      {/* Page content */}
      <main>
        <div className="rounded-2xl border border-border/60 bg-card/50 p-6 shadow-sm sm:p-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 pb-6 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} WingChunWong. All rights reserved.
      </footer>
    </div>
  )
}
