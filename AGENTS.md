# AGENTS.md

## Commands

All commands run from repo root unless noted. Package manager is **Bun**.

| Task | Command |
|------|---------|
| Dev server | `bun run dev` |
| Build | `bun run build` |
| Lint | `bun run lint` |
| Format | `bun run format` |
| Typecheck only | `bun run typecheck` |
| Create blog post (interactive) | `bun run blog` |
| Add shadcn component | `npx shadcn@latest add <component>` |

Server commands (run from `server/`):

| Task | Command |
|------|---------|
| Dev | `bun run dev` |
| Typecheck | `bun run typecheck` |

Verification order: `bun run lint && bun run typecheck` before committing.

## Architecture

- **Frontend**: Next.js 16 + App Router + React 19 + TypeScript 6 + Tailwind CSS 4 + shadcn/ui
- **Server (Hono)**: Separate GitHub contribution API in `server/` — its own `package.json`, TypeScript ~5.5, runs on port 3001
- **Homework crawler**: Python in `hw-list/` — runs daily via GitHub Actions, outputs to `public/hw-list/`. Requires `PORTAL_USERNAME` and `PORTAL_PASSWORD` secrets in GitHub
- **Path alias**: `@/` maps to `./src/` (configured in `tsconfig.json`)
- **MCP**: shadcn MCP server is configured in `opencode.json` — available for component lookups

### Source layout (`src/`)

```
src/
  app/                # Next.js App Router (thin routing layer)
    layout.tsx        # Root layout
    page.tsx          # Home page
    globals.css       # Global styles (Tailwind CSS 4, @theme directives)
    blog/
      page.tsx        # Blog list
      [id]/page.tsx   # Blog detail (generateStaticParams + generateMetadata)
    math-game/        # Math game pages
    hw-list/          # Homework list page
    api/              # Next.js Route Handlers
      blog/route.ts   # Blog JSON API
      github/contributions/[owner]/[repo]/route.ts
    sitemap.ts        # Auto-generated sitemap.xml
    robots.ts         # Auto-generated robots.txt
  features/           # Feature modules (blog, github, home, hw-list, math-games)
    blog/
      components/     # Feature-specific components
      lib/            # Business logic (blog loading via fs + gray-matter)
      pages/          # Route-level page components
      index.ts        # Barrel exports
  shared/
    components/
      layout/         # App shell, theme provider
      ui/             # shadcn/ui components live here
    lib/              # Shared utilities (cn, cva helpers)
  contents/
    blogs/            # Markdown blog posts with YAML frontmatter
```

Each feature follows the pattern: `components/`, `lib/`, `pages/`, `index.ts`.

## Conventions

- **Biome** (not Prettier): `recommended: false` — only explicitly configured rules are active. No semicolons, double quotes, 80-width, trailing commas (es5), LF endings. Tailwind CSS class sorting via Biome's `useSortedClasses` nursery rule. Run `bun run format` (`biome check . --write`) before committing.
- **shadcn/ui config**: `components.json` uses `radix-vega` style, `stone` base color, CSS variables enabled, `rsc: true`. Components go in `src/shared/components/ui/`.
- **Blog posts**: Markdown files in `src/contents/blogs/` with YAML frontmatter (`title`, `date`, `summary`, `cag`, `tags`). The `id` field is optional — defaults to filename (without `.md`). Loaded at build time via `fs` + `gray-matter` (cached in memory). Use `bun run blog` to scaffold a new post interactively.
- **TypeScript strict mode** with `noUnusedLocals` and `noUnusedParameters` enabled. Biome additionally enforces `noExplicitAny` and `noUnusedVariables` at lint time.

## Server (Hono backend — separate service)

The `server/` directory is an independent Hono service for GitHub contribution data. It is **not** the main frontend server.

- Runs on port 3001 (configurable via `PORT` env var)
- Requires `GITHUB_TOKEN` env var in `server/.env`
- CORS allows `https://wwchun.top` and `http://localhost:5173`
- API prefix: `/api/github/`
- The frontend has its own Next.js Route Handler at `src/app/api/github/contributions/[owner]/[repo]/route.ts`

## Deployment

- **Frontend CI** (`.github/workflows/deploy.yml`): on push to `main`, runs `bun run build`, SCPs `.next/`, `public/`, `package.json`, `bun.lock`, `ecosystem.config.cjs`, `next.config.ts`, `src/contents/`, `src/app/globals.css`, `postcss.config.mjs`, `mdx-components.tsx` to VPS at `/var/www/wwchun.top`, installs production deps, restarts PM2
- **PM2**: `ecosystem.config.cjs` runs `next start` on port 3000
- **Homework crawler CI** (`.github/workflows/homework-crawler.yml`): daily cron, runs Python crawler, commits changes to `public/hw-list/` with `[skip ci]`
- **Server deploy**: manual via `server/deploy.sh` or SCP + SSH (see `server/README.md`)
