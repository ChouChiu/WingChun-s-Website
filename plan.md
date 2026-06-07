# Next.js 迁移计划

## 概述

将现有 Vite + React SPA 迁移到 Next.js 15 + App Router，保持 feature-driven 架构，解决 SEO 问题。

## 技术栈

| 类别 | 当前 | 迁移后 |
|------|------|--------|
| 框架 | Vite 8 + React 19 | Next.js 15 + App Router |
| 路由 | React Router v7 | Next.js 文件系统路由 |
| 博客内容 | `import.meta.glob` + 运行时解析 | `next-mdx-remote/rsc` + `gray-matter` |
| 样式 | Tailwind CSS 4 + shadcn/ui | 保持不变 |
| 部署 | 静态 SPA + Nginx | Node.js 服务器 + PM2 + Nginx 反向代理 |
| API | 独立 Hono 服务器 (端口 3001) | Next.js Route Handlers |

---

## 目录结构

```
src/
├── app/                          # Next.js 路由层（薄层，只负责路由）
│   ├── layout.tsx                # 根布局
│   ├── page.tsx                  # 首页 → 导入 features/home
│   ├── globals.css               # 样式（从 index.css 迁移）
│   ├── blog/
│   │   ├── page.tsx              # 博客列表 → 导入 features/blog
│   │   └── [id]/page.tsx         # 博客详情 → 导入 features/blog
│   ├── math-game/
│   │   ├── page.tsx              # 数学游戏首页
│   │   ├── percentage-game/page.tsx
│   │   └── coord-game/page.tsx
│   ├── hw-list/page.tsx          # 作业列表
│   ├── sitemap.ts                # 自动生成 sitemap.xml
│   ├── robots.ts                 # 自动生成 robots.txt
│   └── api/
│       └── github/contributions/[owner]/[repo]/route.ts
│
├── features/                     # 功能模块（保持现有结构）
│   ├── blog/
│   │   ├── components/
│   │   │   ├── markdown-renderer.tsx
│   │   │   ├── table-of-contents.tsx
│   │   │   └── giscus-comments.tsx
│   │   ├── lib/
│   │   │   ├── blog.ts           # 重构：import.meta.glob → fs 读取
│   │   │   └── toc.ts
│   │   └── index.ts
│   │
│   ├── github/
│   │   ├── components/
│   │   │   └── contribution-card.tsx
│   │   ├── lib/
│   │   │   └── github.ts
│   │   └── types/
│   │       └── github.ts
│   │
│   ├── home/
│   │   └── index.tsx
│   │
│   ├── hw-list/
│   │   ├── data/
│   │   │   └── homework.ts
│   │   ├── lib/
│   │   │   └── homework.ts
│   │   └── pages/
│   │       └── hw-list.tsx
│   │
│   └── math-games/
│       ├── components/
│       │   └── calculator.tsx
│       ├── coord-game/
│       │   └── index.tsx
│       ├── percentage-game/
│       │   └── index.tsx
│       └── index.ts
│
└── shared/
    ├── components/
    │   ├── icons/
    │   │   └── github-icon.tsx
    │   ├── layout/
    │   │   ├── layout.tsx        # 重构为 Next.js 布局组件
    │   │   ├── navbar.tsx        # 更新 Link 导入
    │   │   ├── left-sidebar.tsx
    │   │   ├── right-sidebar.tsx
    │   │   ├── profile-card.tsx
    │   │   ├── sidebar-widgets.tsx
    │   │   ├── theme-provider.tsx
    │   │   ├── theme-toggle.tsx
    │   │   └── blog-context.tsx
    │   └── ui/
    │       ├── avatar.tsx
    │       ├── badge.tsx
    │       ├── button.tsx
    │       ├── button-variants.ts
    │       └── separator.tsx
    └── lib/
        └── utils.ts
```

---

## 阶段 1：Next.js 项目初始化

### 1.1 初始化项目

```bash
# 在当前目录初始化 Next.js（不会覆盖现有文件）
npx create-next-app@latest . --typescript --tailwind --app --src-dir --no-git
```

### 1.2 安装依赖

```bash
# 核心依赖
bun add next react react-dom

# 博客内容处理
bun add next-mdx-remote gray-matter remark-gfm remark-math rehype-katex rehype-raw rehype-github-alerts

# 保持现有依赖
bun add @giscus/react @iconify/react class-variance-authority clsx katex lucide-react radix-ui react-markdown react-syntax-highlighter tailwind-merge yaml

# 开发依赖
bun add -D @types/node @types/react @types/react-dom typescript

# Tailwind CSS 4
bun add tailwindcss @tailwindcss/postcss tw-animate-css
```

### 1.3 配置文件

**`next.config.ts`**：
```typescript
import type { NextConfig } from 'next'
import createMDX from '@next/mdx'

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  // 如果需要，可以配置 rewrites 保持旧 URL 兼容
}

const withMDX = createMDX({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
})

export default withMDX(nextConfig)
```

**`postcss.config.mjs`**：
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

**`mdx-components.tsx`**（项目根目录）：
```typescript
import type { MDXComponents } from 'mdx/types'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
  }
}
```

---

## 阶段 2：样式迁移

### 2.1 迁移 CSS

将 `src/index.css` 内容迁移到 `src/app/globals.css`，调整 Tailwind 导入：

```css
@import "tailwindcss";
@import "tw-animate-css";

/* 保留所有现有样式 */
```

### 2.2 更新 Tailwind 配置

Tailwind CSS 4 使用 CSS-based 配置，无需 `tailwind.config.js`。在 `globals.css` 中使用 `@theme` 指令定义主题。

---

## 阶段 3：布局迁移

### 3.1 根布局

**`src/app/layout.tsx`**：
```typescript
import type { Metadata } from 'next'
import { ThemeProvider } from '@/shared/components/layout/theme-provider'
import { Layout } from '@/shared/components/layout/layout'
import './globals.css'

export const metadata: Metadata = {
  title: 'ChouChiu 的網站',
  description: '歡迎來到 ChouChiu 的網站',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider disableTransitionOnChange={false}>
          <Layout>{children}</Layout>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### 3.2 更新布局组件

需要修改的文件：

| 文件 | 修改内容 |
|------|----------|
| `shared/components/layout/layout.tsx` | 移除 `BrowserRouter`，改用 `usePathname` |
| `shared/components/layout/navbar.tsx` | `Link` 改用 `next/link`，`useLocation` 改用 `usePathname` |
| `shared/components/layout/right-sidebar.tsx` | `useLocation` 改用 `usePathname` |
| `shared/components/layout/sidebar-widgets.tsx` | `Link` 改用 `next/link` |

在所有使用浏览器 API 的组件顶部添加 `"use client"`：
- `theme-provider.tsx`
- `theme-toggle.tsx`
- `profile-card.tsx`
- `blog-context.tsx`

---

## 阶段 4：路由迁移

### 4.1 首页

**`src/app/page.tsx`**：
```typescript
import { HomePage } from '@/features/home'

export default function Page() {
  return <HomePage />
}
```

更新 `features/home/index.tsx`，移除 React Router 依赖，改用 `next/link`。

### 4.2 博客列表

**`src/app/blog/page.tsx`**：
```typescript
import { BlogListPage } from '@/features/blog'

export default function Page() {
  return <BlogListPage />
}
```

### 4.3 博客详情

**`src/app/blog/[id]/page.tsx`**：
```typescript
import { BlogPostPage, getAllPosts, getPostById } from '@/features/blog'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map(post => ({ id: post.id }))
}

export async function generateMetadata({ params }): Promise<Metadata> {
  const { id } = await params
  const post = getPostById(id)
  if (!post) return {}
  
  return {
    title: `${post.title} | ChouChiu 的網站`,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: 'article',
      publishedTime: post.date,
    },
  }
}

export default async function Page({ params }) {
  const { id } = await params
  const post = getPostById(id)
  if (!post) notFound()
  
  return <BlogPostPage post={post} />
}
```

### 4.4 数学游戏页面

```typescript
// src/app/math-game/page.tsx
import { MathGamePage } from '@/features/math-games'
export default function Page() { return <MathGamePage /> }

// src/app/math-game/percentage-game/page.tsx
import { PercentageGamePage } from '@/features/math-games'
export default function Page() { return <PercentageGamePage /> }

// src/app/math-game/coord-game/page.tsx
import { CoordGamePage } from '@/features/math-games'
export default function Page() { return <CoordGamePage /> }
```

### 4.5 作业列表

```typescript
// src/app/hw-list/page.tsx
import { HwListPage } from '@/features/hw-list'
export default function Page() { return <HwListPage /> }
```

---

## 阶段 5：博客系统重构

### 5.1 重构 `features/blog/lib/blog.ts`

替换 `import.meta.glob` 为 `fs` 读取：

```typescript
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const POSTS_DIR = path.join(process.cwd(), 'src/contents/blogs')

export interface BlogPost {
  id: string
  title: string
  date: string
  summary: string
  cag: string
  tags: string[]
  content: string
}

let cachedPosts: BlogPost[] | null = null

export function getAllPosts(): BlogPost[] {
  if (cachedPosts) return cachedPosts
  
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'))
  
  cachedPosts = files.map(filename => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, filename), 'utf8')
    const { data, content } = matter(raw)
    
    return {
      id: data.id || filename.replace('.md', ''),
      title: data.title || filename,
      date: data.date || '',
      summary: data.summary || '',
      cag: data.cag || '',
      tags: data.tags || [],
      content,
    }
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  return cachedPosts
}

export function getPostById(id: string): BlogPost | undefined {
  return getAllPosts().find(post => post.id === id)
}
```

### 5.2 更新博客详情组件

更新 `features/blog/pages/blog-post.tsx`，接收 post 数据作为 props：

```typescript
'use client'

import { MDXRemote } from 'next-mdx-remote/rsc'
import type { BlogPost } from '../lib/blog'
// ... 其他导入

interface BlogPostPageProps {
  post: BlogPost
}

export function BlogPostPage({ post }: BlogPostPageProps) {
  // 移除数据加载逻辑，直接使用 post prop
  // 保留渲染逻辑
}
```

### 5.3 更新导出

更新 `features/blog/index.ts`：

```typescript
// 组件
export { MarkdownRenderer } from './components/markdown-renderer'
export { TableOfContents } from './components/table-of-contents'
export { GiscusComments } from './components/giscus-comments'

// 页面组件
export { BlogPostPage } from './pages/blog-post'
export { BlogListPage } from './pages/blog-list'

// 数据加载
export { getAllPosts, getPostById } from './lib/blog'
export type { BlogPost } from './lib/blog'

// 工具
export { extractHeadings, countWords } from './lib/toc'
```

---

## 阶段 6：API 迁移

### 6.1 创建 Route Handler

**`src/app/api/github/contributions/[owner]/[repo]/route.ts`**：
```typescript
import { NextResponse } from 'next/server'
import { fetchGitHubContributions } from '@/features/github/lib/github'

export async function GET(
  request: Request,
  { params }: { params: { owner: string; repo: string } }
) {
  const { owner, repo } = await params
  
  try {
    const data = await fetchGitHubContributions(owner, repo)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch contributions' },
      { status: 500 }
    )
  }
}
```

### 6.2 更新前端 API 调用

更新 `features/github/lib/github.ts`，将 API 路径从 `/api/github/contributions/...` 保持不变（Next.js 会处理）。

---

## 阶段 7：SEO 优化

### 7.1 动态 Metadata

在每个页面组件中使用 `generateMetadata`：

```typescript
// 博客详情页已在阶段 4.3 实现

// 首页
export const metadata: Metadata = {
  title: 'ChouChiu 的網站',
  description: '歡迎來到 ChouChiu 的網站',
  openGraph: {
    title: 'ChouChiu 的網站',
    description: '歡迎來到 ChouChiu 的網站',
    url: 'https://wwchun.top',
    siteName: 'ChouChiu 的網站',
    locale: 'zh_TW',
    type: 'website',
  },
}
```

### 7.2 Sitemap

**`src/app/sitemap.ts`**：
```typescript
import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/features/blog'

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts()
  
  const blogPosts = posts.map(post => ({
    url: `https://wwchun.top/blog/${post.id}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))
  
  return [
    {
      url: 'https://wwchun.top',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://wwchun.top/blog',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...blogPosts,
    {
      url: 'https://wwchun.top/math-game',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://wwchun.top/hw-list',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ]
}
```

### 7.3 Robots.txt

**`src/app/robots.ts`**：
```typescript
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://wwchun.top/sitemap.xml',
  }
}
```

### 7.4 JSON-LD 结构化数据

在博客详情页添加 Article schema：

```typescript
// 在 BlogPostPage 组件中
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: post.title,
  datePublished: post.date,
  description: post.summary,
  author: {
    '@type': 'Person',
    name: 'ChouChiu',
  },
}

return (
  <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
    {/* 页面内容 */}
  </>
)
```

---

## 阶段 8：部署配置

### 8.1 PM2 配置

**`ecosystem.config.js`**（项目根目录）：
```javascript
module.exports = {
  apps: [
    {
      name: 'wwchun-top',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/wwchun.top',
      instances: 1,
      autorestart: true,
      wait_ready: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
```

### 8.2 Nginx 配置更新

**`server/nginx.conf`**（更新）：
```nginx
server {
    listen 80;
    server_name wwchun.top www.wwchun.top;

    # www 重定向
    if ($host = www.wwchun.top) {
        return 301 https://wwchun.top$request_uri;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Next.js 静态资源缓存
    location /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 公共静态文件
    location /public/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 8.3 更新 GitHub Actions

**`.github/workflows/deploy.yml`**（更新）：
```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
      
      - name: Build
        run: bun run build
      
      - name: Deploy to VPS
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.VPS_HOST }}
          username: root
          key: ${{ secrets.VPS_SSH_KEY }}
          source: ".next,public,package.json,bun.lock,ecosystem.config.js,next.config.ts"
          target: /var/www/wwchun.top
      
      - name: Install dependencies on VPS
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: root
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/wwchun.top
            bun install --production
            pm2 restart wwchun-top || pm2 start ecosystem.config.js
```

---

## 阶段 9：清理

### 9.1 删除旧文件

- `index.html`（Next.js 自动生成）
- `vite.config.ts`（使用 `next.config.ts`）
- `tsconfig.node.json`（不再需要）
- `src/main.tsx`（Next.js 有入口文件）
- `src/App.tsx`（路由在 app/ 目录）

### 9.2 更新 package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "biome check .",
    "format": "biome check . --write",
    "typecheck": "tsc --noEmit",
    "blog": "bun run scripts/create-blog.ts"
  }
}
```

### 9.3 更新 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## 文件修改清单

### 需要修改的文件（16 个）

| 文件 | 修改内容 |
|------|----------|
| `src/features/blog/lib/blog.ts` | 替换 `import.meta.glob` 为 `fs` 读取 |
| `src/features/blog/pages/blog-post.tsx` | 接收 post 数据作为 props，添加 `"use client"` |
| `src/features/blog/pages/blog-list.tsx` | 移除数据加载，改为纯组件 |
| `src/features/blog/index.ts` | 更新导出 |
| `src/features/home/index.tsx` | 改用 `next/link` |
| `src/features/hw-list/pages/hw-list.tsx` | 添加 `"use client"` |
| `src/features/github/lib/github.ts` | 检查 API 路径兼容性 |
| `src/features/math-games/pages/math-games.tsx` | 改用 `next/link` |
| `src/features/math-games/percentage-game/index.tsx` | 添加 `"use client"` |
| `src/features/math-games/coord-game/index.tsx` | 添加 `"use client"` |
| `src/shared/components/layout/layout.tsx` | 移除 `BrowserRouter`，改用 `usePathname` |
| `src/shared/components/layout/navbar.tsx` | 改用 `next/link` 和 `usePathname` |
| `src/shared/components/layout/right-sidebar.tsx` | 改用 `usePathname` |
| `src/shared/components/layout/sidebar-widgets.tsx` | 改用 `next/link` |
| `src/shared/components/layout/theme-provider.tsx` | 添加 `"use client"` |
| `src/shared/components/layout/theme-toggle.tsx` | 添加 `"use client"` |

### 需要新建的文件（12 个）

| 文件 | 用途 |
|------|------|
| `src/app/layout.tsx` | 根布局 |
| `src/app/page.tsx` | 首页 |
| `src/app/globals.css` | 全局样式 |
| `src/app/blog/page.tsx` | 博客列表 |
| `src/app/blog/[id]/page.tsx` | 博客详情 |
| `src/app/math-game/page.tsx` | 数学游戏首页 |
| `src/app/math-game/percentage-game/page.tsx` | 百分比游戏 |
| `src/app/math-game/coord-game/page.tsx` | 坐标游戏 |
| `src/app/hw-list/page.tsx` | 作业列表 |
| `src/app/sitemap.ts` | Sitemap 生成 |
| `src/app/robots.ts` | Robots.txt 生成 |
| `src/app/api/github/contributions/[owner]/[repo]/route.ts` | GitHub API |
| `mdx-components.tsx` | MDX 组件映射 |
| `ecosystem.config.js` | PM2 配置 |

### 保持不变的文件（20+ 个）

- 所有 `features/*/components/` 下的组件
- 所有 `shared/components/ui/` 下的 shadcn 组件
- `features/blog/lib/toc.ts`
- `features/hw-list/lib/homework.ts`
- `features/hw-list/data/homework.ts`
- `features/github/types/github.ts`
- `shared/lib/utils.ts`
- `scripts/create-blog.ts`
- `scripts/homework-crawler.ts`

---

## 预期效果

### SEO 改进

- ✅ 搜索引擎可以抓取完整 HTML 内容（服务器渲染）
- ✅ 每个页面有独立的 title 和 description
- ✅ 自动生成 sitemap.xml 和 robots.txt
- ✅ 支持 Open Graph 和 Twitter Card
- ✅ 博客文章有 JSON-LD 结构化数据
- ✅ 支持 canonical URL

### 性能改进

- ✅ 首屏加载更快（服务器渲染）
- ✅ 更好的 Core Web Vitals 分数
- ✅ 支持 ISR（增量静态再生）
- ✅ 自动代码分割

### 开发体验改进

- ✅ 保持 feature-driven 架构
- ✅ 类型安全的博客内容
- ✅ 更好的构建时错误检查
- ✅ 统一的 API 路由

---

## 风险和缓解措施

| 风险 | 缓解措施 |
|------|----------|
| 构建时间增加 | 使用 ISR，只在内容变化时重新生成 |
| Canvas 组件兼容性 | 添加 `"use client"` 标记，保持客户端渲染 |
| 部署复杂度增加 | 使用 PM2 自动重启，配置健康检查 |
| 旧 URL 失效 | 配置 redirects 保持兼容 |

---

## 时间估算

| 阶段 | 时间 |
|------|------|
| 阶段 1-2：初始化和样式 | 1 天 |
| 阶段 3：布局迁移 | 0.5 天 |
| 阶段 4：路由迁移 | 0.5 天 |
| 阶段 5：博客系统重构 | 1 天 |
| 阶段 6：API 迁移 | 0.5 天 |
| 阶段 7：SEO 优化 | 0.5 天 |
| 阶段 8：部署配置 | 1 天 |
| 阶段 9：清理和测试 | 0.5 天 |
| **总计** | **5.5 天** |
