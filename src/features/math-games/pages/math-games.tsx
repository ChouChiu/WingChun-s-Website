import { Grid3X3, Percent } from "lucide-react"
import Link from "next/link"

const mathGames = [
  {
    href: "/math-game/percentage-game",
    title: "Percentage Game",
    description: "Practice calculating percentages quickly",
    icon: Percent,
  },
  {
    href: "/math-game/coord-game",
    title: "Coordinate Game",
    description: "Identify coordinates on a grid",
    icon: Grid3X3,
  },
]

export function MathGamePage() {
  return (
    <div>
      <h1 className="stagger-1 mb-6 animate-fade-in-up font-bold font-heading text-2xl">
        Math Games
      </h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {mathGames.map((game, idx) => (
          <Link
            key={game.href}
            href={game.href}
            className="group flex animate-fade-in-up items-start gap-4 rounded-lg border border-border/60 bg-muted/30 p-5 transition-all duration-200 hover:border-border hover:bg-muted/50"
            style={{ animationDelay: `${150 + idx * 80}ms` }}
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <game.icon className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold group-hover:text-primary">
                {game.title}
              </h2>
              <p className="mt-0.5 text-muted-foreground text-sm">
                {game.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
