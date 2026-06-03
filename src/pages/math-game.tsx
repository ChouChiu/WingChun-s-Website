import { Link } from "react-router-dom"
import { Gamepad2, Grid3X3, Percent } from "lucide-react"

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
    <div className="mx-auto max-w-[860px]">
      <h1 className="mb-6 font-heading text-2xl font-bold">Math Games</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {mathGames.map((game) => (
          <Link
            key={game.href}
            to={game.href}
            className="group flex items-start gap-4 rounded-lg border border-border/60 bg-muted/30 p-5 transition-all duration-200 hover:border-border hover:bg-muted/50"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <game.icon className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold group-hover:text-primary">
                {game.title}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {game.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
