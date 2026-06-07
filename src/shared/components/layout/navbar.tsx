"use client"

import {
  BookOpen,
  Calculator,
  ClipboardList,
  Home,
  Menu,
  X,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "../../lib/utils"
import { GithubIcon } from "../icons/github-icon"
import { Button } from "../ui/button"
import { ThemeToggle } from "./theme-toggle"

const navLinks = [
  { href: "/", label: "主頁", icon: Home },
  { href: "/blog", label: "網誌", icon: BookOpen },
  { href: "/hw-list", label: "功課列表", icon: ClipboardList },
  { href: "/math-game", label: "數學遊戲", icon: Calculator },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 animate-slide-down border-border/60 border-b bg-card/80 backdrop-blur-xl",
          "transition-colors duration-200"
        )}
      >
        <div className="mx-auto flex max-w-[1440px] items-center px-4 py-3 lg:px-6">
          <Link
            href="/"
            className="shrink-0 font-bold font-heading text-lg tracking-tight"
          >
            ChouChiu
          </Link>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </Button>

          {/* Desktop nav - centered */}
          <nav className="hidden items-center gap-1 lg:absolute lg:top-1/2 lg:left-1/2 lg:flex lg:-translate-x-1/2 lg:-translate-y-1/2">
            {navLinks.map((link) => (
              <Button
                key={link.href}
                variant={isActive(link.href) ? "secondary" : "ghost"}
                size="sm"
                asChild
                className={cn(
                  "relative",
                  isActive(link.href) &&
                    "after:absolute after:-bottom-3 after:left-1/2 after:h-[3px] after:w-4 after:-translate-x-1/2 after:rounded-full after:bg-primary"
                )}
              >
                <Link href={link.href}>
                  <link.icon className="mr-1.5 size-4" />
                  {link.label}
                </Link>
              </Button>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-1 lg:flex">
            <ThemeToggle />
            <Button variant="ghost" size="icon" asChild>
              <a
                href="https://github.com/ChouChiu"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GithubIcon className="size-5" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <nav
        className={cn(
          "sticky top-0 z-40 border-border/60 border-b bg-card/80 backdrop-blur-xl lg:hidden",
          mobileOpen ? "animate-slide-down p-3" : "hidden"
        )}
      >
        <div className="mx-auto max-w-[1440px]">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Button
                key={link.href}
                variant={isActive(link.href) ? "secondary" : "ghost"}
                size="sm"
                asChild
                className="justify-start"
                onClick={() => setMobileOpen(false)}
              >
                <Link href={link.href}>
                  <link.icon className="mr-2 size-4" />
                  {link.label}
                </Link>
              </Button>
            ))}
            <Button variant="ghost" size="sm" asChild className="justify-start">
              <a
                href="https://github.com/ChouChiu"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GithubIcon className="mr-2 size-4" />
                GitHub
              </a>
            </Button>
            <div className="px-2 pt-1">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
