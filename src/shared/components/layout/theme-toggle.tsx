import { Monitor, Moon, Sun } from "lucide-react"
import { cn } from "../../lib/utils"
import { useTheme } from "./theme-provider"

const options = [
  { value: "light" as const, icon: Sun, label: "亮色" },
  { value: "dark" as const, icon: Moon, label: "暗色" },
  { value: "system" as const, icon: Monitor, label: "跟隨系統" },
]

function resolve(t: "light" | "dark" | "system"): "light" | "dark" {
  if (t !== "system") return t
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  const handleChange = (next: "light" | "dark" | "system") => {
    if (next === theme) return
    if (resolve(theme) === resolve(next)) {
      setTheme(next)
    } else if ("startViewTransition" in document) {
      document.startViewTransition(() => setTheme(next))
    } else {
      setTheme(next)
    }
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-border/60 bg-muted/50 p-0.5",
        className
      )}
    >
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => handleChange(value)}
          aria-label={label}
          className={cn(
            "flex size-7 items-center justify-center rounded-full transition-all duration-200",
            theme === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  )
}
