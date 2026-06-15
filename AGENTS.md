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

Verification order: `bun run lint && bun run typecheck` before committing.

## Architecture

- **Frontend**: Next.js 16 + App Router + React 19 + TypeScript 6 + Tailwind CSS 4 + shadcn/ui
- **Homework crawler**: Bun/TS script at `scripts/homework-crawler.ts` — runs daily via GitHub Actions, outputs to `public/hw-list/`. Requires `PORTAL_USERNAME` and `PORTAL_PASSWORD` secrets in GitHub
- **Path alias**: `@/` maps to `./src/` (configured in `tsconfig.json`)
- **MCP**: shadcn MCP server is configured in `opencode.json` — available for component lookups
- **README.md is stale**: it mentions Vite — ignore it; the stack is Next.js

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

- **Biome** (not Prettier): `recommended: false` — only explicitly configured rules are active. No semicolons, double quotes, 80-width, trailing commas (es5), LF endings. Tailwind CSS class sorting via Biome's `useSortedClasses` nursery rule. Biome also handles CSS formatting and auto-organizes imports (`assist.actions.source.organizeImports`). Run `bun run format` (`biome check . --write`) before committing.
- **shadcn/ui config**: `components.json` uses `radix-vega` style, `stone` base color, CSS variables enabled, `rsc: true`. Components go in `src/shared/components/ui/`. Note: `components.json` aliases point to `@/components/ui` but `@/` resolves to `./src/`, so generated files land in `src/components/ui/` — the actual components live in `src/shared/components/ui/`. After running `npx shadcn@latest add`, move the file to the correct location.
- **shadcn imports**: Components in `src/shared/` use relative imports (e.g., `../../lib/utils`), not the `@/` alias. Follow this convention when editing existing shadcn components.
- **Blog posts**: Markdown files in `src/contents/blogs/` with YAML frontmatter (`title`, `date`, `summary`, `cag`, `tags`). The `id` field is optional — defaults to filename (without `.md`). Loaded at build time via `fs` + `gray-matter` (cached in memory). Use `bun run blog` to scaffold a new post interactively. `next.config.ts` includes `.md` and `.mdx` in `pageExtensions` to support this.
- **Scripts**: `scripts/create-blog.ts` (blog scaffold), `scripts/homework-crawler.ts` (daily crawler), `scripts/sync-stblog.sh` (blog sync).
- **TypeScript strict mode** with `noUnusedLocals` and `noUnusedParameters` enabled. Biome additionally enforces `noExplicitAny` and `noUnusedVariables` at lint time.

## Deployment

- **Vercel**: Frontend auto-deploys on push to `main`. Requires `GITHUB_TOKEN` env var in Vercel project settings.
- **Homework crawler CI** (`.github/workflows/homework-crawler.yml`): daily cron, runs Bun crawler, commits changes to `public/hw-list/` with `[skip ci]`
