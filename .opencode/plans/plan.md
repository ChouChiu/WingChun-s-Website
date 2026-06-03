# 博客系统重构计划

## 概述

将博文存储从硬编码 TypeScript 数组改为带 YAML front matter 的 Markdown 文件，添加交互式 CLI 创建博文，替换手写解析器为完整的 Markdown 渲染引擎（GFM + 扩展）。

## 技术选型

| 模块 | 方案 |
|---|---|
| Markdown 渲染 | `react-markdown` + remark/rehype 插件链 |
| Front matter 解析 | `yaml` + 自定义正则提取（替代 gray-matter，避免浏览器 buffer 问题） |
| 博文加载 | Vite `import.meta.glob("?raw")` |
| GFM 扩展 | `remark-gfm`（表格/任务列表/删除线/脚注/自动链接） |
| Emoji shortcode | `remark-emoji`（`:smile:` → 😄） |
| 数学公式 | `remark-math` + `rehype-katex` |
| 原始 HTML | `rehype-raw`（支持 `<sub>`/`<sup>`/`<mark>`/`<kbd>`/`<dl>`/`<details>`/`<ins>`） |
| Callouts | `rehype-github-alerts`（`> [!NOTE]` 等） |
| 代码高亮 | `react-syntax-highlighter`（Prism）+ 自定义 header |
| 语言图标 | `@iconify/react`（按需 API 加载，零打包膨胀） |
| 交互式 CLI | `@clack/prompts` |

## 依赖安装

```bash
# dependencies
bun add react-markdown remark-gfm remark-emoji remark-math rehype-katex rehype-raw rehype-github-alerts katex @iconify/react yaml

# devDependencies
bun add -d @clack/prompts
```

## 插件链顺序

```
Markdown string
  → remark-gfm            (GFM: 表格/任务列表/删除线/脚注/自动链接)
  → remark-emoji           (emoji shortcode → Unicode)
  → remark-math            (数学公式语法 $...$ / $$...$$)
  → remark-rehype          (mdast → hast)
  → rehype-raw             (保留原始 HTML: <sub>, <sup>, <mark>, <kbd>, <dl>, <details>, <ins>)
  → rehype-katex           (数学公式 → KaTeX HTML)
  → rehype-github-alerts   (callouts: > [!NOTE] / > [!TIP] 等)
  → React components       (自定义渲染)
```

## 实施步骤

### 步骤 1：创建博文目录与迁移数据

创建 `src/contents/blogs/` 目录，将现有 3 篇博文迁移为 `.md` 文件：

- `src/contents/blogs/welcome.md`
- `src/contents/blogs/vibe-coding.md`
- `src/contents/blogs/hong-kong-tech.md`
- `src/contents/blogs/markdown-test.md`（用户提供的全样式测试文档）

文件格式：
```markdown
---
id: "welcome"
title: "Welcome to My Website"
date: "2026-06-03"
summary: "Hello! This is my personal website built with React, Vite, and shadcn/ui."
tags: [introduction, website]
---

（正文 Markdown）
```

### 步骤 2：安装依赖

```bash
bun add react-markdown remark-gfm remark-emoji remark-math rehype-katex rehype-raw rehype-github-alerts katex @iconify/react yaml
bun add -d @clack/prompts
```

### 步骤 3：创建博文加载模块

新建 `src/lib/blog.ts`：

- 定义 `BlogPost` 接口（id, title, date, summary, tags, content）
- 自定义 `parseFrontMatter()` 函数：用正则提取 `---` 之间的 YAML，用 `yaml` 包的 `parse()` 解析
- 使用 `import.meta.glob("../contents/blogs/*.md", { query: "?raw", import: "default" })` 加载所有 `.md` 文件
- 导出 `getAllPosts()`（按日期倒序）和 `getPostById(id)`
- 在内存中缓存解析结果

```typescript
import { parse } from "yaml"

function parseFrontMatter(raw: string): { data: FrontMatter; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { data: {}, content: raw }
  const data = parse(match[1]) as FrontMatter
  const content = match[2].trim()
  return { data, content }
}
```

### 步骤 4：创建 Markdown 渲染组件

新建 `src/components/markdown-renderer.tsx`：

封装 `<ReactMarkdown>` 及全部插件配置。

自定义 `components` 映射：

| 组件 | 行为 |
|---|---|
| `code` | 提取 `language-xxx`；有语言 → header bar（Iconify 图标 + 语言名）+ `<SyntaxHighlighter>`；无语言 → 普通 `<code>` |
| `table` | `<div class="overflow-x-auto">` 包裹实现响应式滚动 |
| `blockquote` | callout 由 rehype-github-alerts 处理；普通引用用自定义样式 |
| `a` | 外部链接 `target="_blank" rel="noopener noreferrer"` |
| `input` | 任务列表 checkbox 自定义样式 |

代码块语言 badge 实现：

```tsx
import { Icon } from "@iconify/react"

const languageIconMap: Record<string, string> = {
  javascript: "skill-icons:javascript",
  js: "skill-icons:javascript",
  typescript: "skill-icons:typescript",
  ts: "skill-icons:typescript",
  python: "skill-icons:python",
  java: "skill-icons:java",
  css: "skill-icons:css",
  html: "skill-icons:html",
  react: "skill-icons:react",
  jsx: "skill-icons:react",
  tsx: "skill-icons:react",
  go: "skill-icons:golang",
  rust: "skill-icons:rust",
  bash: "skill-icons:bash",
  sh: "skill-icons:bash",
  shell: "skill-icons:bash",
  sql: "skill-icons:mysql",
  json: "skill-icons:json",
  yaml: "skill-icons:yaml",
  md: "skill-icons:markdown",
  markdown: "skill-icons:markdown",
  dockerfile: "skill-icons:docker",
  docker: "skill-icons:docker",
}
// 无匹配 → 仅显示文字，无图标
// Iconify API 加载失败 → 优雅降级为纯文字标签
```

### 步骤 5：重写博文渲染页面

修改 `src/pages/blog-post.tsx`：

- 移除全部手写解析逻辑（`renderInline` 函数、逐行 `startsWith` 判断）
- 从 `src/lib/blog.ts` 获取博文数据
- 使用 `<MarkdownRenderer>` 组件渲染 `post.content`
- 保留页面布局（返回按钮、标题、日期、标签）

### 步骤 6：更新博文列表页面

修改 `src/pages/blog.tsx`：

- 数据源从 `src/data/blog-posts.ts` 改为 `src/lib/blog.ts` 的 `getAllPosts()`
- 卡片 UI 保持不变

### 步骤 7：添加自定义样式

修改 `src/index.css`（或新建 `src/styles/markdown.css`）：

所有样式使用网站 CSS 变量，匹配 stone 色调，支持 dark mode。

| 组件 | 样式要点 |
|---|---|
| 代码块 header | `bg-muted` 背景、`border-b`、语言图标（16px）+ 语言名、上圆角 |
| 代码块内容 | 暗色背景（dark mode 自适应）、等宽字体 |
| Callouts | 5 种类型配色用网站 primary/accent/muted 变体；左侧 4px 色条；SVG 图标；圆角卡片 |
| 表格 | `border-border` 边框、`bg-muted/30` 斑马纹、对齐方式 |
| 引用块 | `border-l-4 border-primary/30`、`bg-muted/20` |
| 任务列表 | 自定义 checkbox（accent 色勾选） |
| 脚注 | 分隔线 + 小字、脚注引用上标 |
| `<mark>` | `bg-primary/20` 圆角 |
| `<kbd>` | `border bg-muted shadow-sm rounded` |
| `<details>` | 折叠箭头 + `border rounded` |
| `<sub>/<sup>` | 字号 75%、行高调整 |
| `<ins>` | `underline decoration-primary` |
| 图片 | `rounded-lg mx-auto max-w-full` |
| KaTeX | 覆盖颜色变量适配 dark mode |

导入 KaTeX CSS：在入口文件或渲染组件中 `import "katex/dist/katex.min.css"`

### 步骤 8：创建 `bun run blog` CLI 脚本

新建 `scripts/create-blog.ts`：

1. **扫描已有 tag**：遍历 `src/contents/blogs/*.md`，用 `yaml` 解析 front matter，提取所有 `tags`，去重
2. **交互式提示**（`@clack/prompts`）：
   - `title`：文本输入
   - `date`：默认今天日期（可改）
   - `summary`：文本输入
   - `tags`：multi-select 显示已有 tag 供勾选 + "输入新 tag" 选项
3. 合并选中的已有 tag + 新输入的 tag
4. 文件名 slug 化（如 "My New Post" → `my-new-post.md`）
5. 文件存在检查（存在则警告/确认覆盖）
6. 生成文件到 `src/contents/blogs/{slug}.md`

修改 `package.json`，添加 script：
```json
"blog": "bun run scripts/create-blog.ts"
```

### 步骤 9：清理旧文件

删除 `src/data/blog-posts.ts`

### 步骤 10：验证渲染效果

用测试文档 `/blog/markdown-test` 逐项验证：

| # | 测试项 | 方案 |
|---|---|---|
| 1 | H1–H6 标题 | react-markdown 内置 |
| 2 | 粗体/斜体/粗斜体 | react-markdown 内置 |
| 3 | ~~删除线~~ | remark-gfm |
| 4 | `<mark>高亮</mark>` | rehype-raw |
| 5 | 引用块嵌套 | react-markdown 内置 + 样式 |
| 6 | 有序/无序/混合列表 | react-markdown 内置 |
| 7 | 任务列表 `- [x]` | remark-gfm |
| 8 | 表格（含对齐） | remark-gfm |
| 9 | 代码块 + 语言 badge | 自定义组件 + @iconify/react |
| 10 | 链接（内联/引用/自动） | remark-gfm + 内置 |
| 11 | 图片 | react-markdown 内置 |
| 12 | 脚注 | remark-gfm v4+ |
| 13 | `:smile:` emoji | remark-emoji |
| 14 | `<dl>` 定义列表 | rehype-raw |
| 15 | `<sub>`/`<sup>` | rehype-raw |
| 16 | 数学公式 | remark-math + rehype-katex |
| 17 | 内嵌 HTML | rehype-raw |
| 18 | `<kbd>` 标签 | rehype-raw + CSS |
| 19 | Callouts | rehype-github-alerts |
| 20 | 转义字符 | react-markdown 内置 |
| 21 | 表格内 `<br>` | remark-gfm + rehype-raw |

### 步骤 11：Lint & Typecheck

```bash
bun run typecheck && bun run lint
```

## 文件变更总览

| 操作 | 文件 | 说明 |
|---|---|---|
| **新建** | `src/contents/blogs/*.md` | 3 篇博文 + 1 篇测试文档 |
| **新建** | `src/lib/blog.ts` | 博文加载/解析模块 |
| **新建** | `src/components/markdown-renderer.tsx` | Markdown 渲染组件（含语言 badge） |
| **新建** | `scripts/create-blog.ts` | 交互式 CLI 脚本 |
| **修改** | `src/pages/blog-post.tsx` | 改用 MarkdownRenderer |
| **修改** | `src/pages/blog.tsx` | 改用新数据源 |
| **修改** | `src/index.css` | Markdown + 插件样式 |
| **修改** | `package.json` | 依赖 + `blog` script |
| **删除** | `src/data/blog-posts.ts` | 旧的硬编码数据 |

## 已知限制

| 特性 | 状态 | 说明 |
|---|---|---|
| `H~2~O` 语法 | 不支持 | 用 HTML `<sub>` 写法 |
| `X^2^` 语法 | 不支持 | 用 HTML `<sup>` 写法 |
| `==高亮==` 语法 | 不支持 | 用 HTML `<mark>` 写法 |
| `++插入++` 语法 | 不支持 | 用 HTML `<ins>` 写法 |
| Emoji 离线 | 受限 | `remark-emoji` 将 shortcode 转为 Unicode，内联 emoji 正常；但 Iconify API 图标需网络 |
| Iconify 图标离线 | 不显示 | 语言图标从 API 按需加载，离线时降级为纯文字标签 |
