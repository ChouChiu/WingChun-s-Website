import { parse } from "yaml"

export interface BlogPost {
  id: string
  title: string
  date: string
  summary: string
  cag: string
  tags: string[]
  content: string
}

interface FrontMatter {
  id?: string
  title?: string
  date?: string
  summary?: string
  cag?: string
  tags?: string[]
}

const rawFiles = import.meta.glob("../../../contents/blogs/*.md", {
  query: "?raw",
  import: "default",
})

function parseFrontMatter(raw: string): { data: FrontMatter; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { data: {}, content: raw }
  const data = parse(match[1]) as FrontMatter
  const content = match[2].trim()
  return { data, content }
}

let cachedPosts: BlogPost[] | null = null

async function loadAllPosts(): Promise<BlogPost[]> {
  if (cachedPosts) return cachedPosts

  const posts: BlogPost[] = []

  for (const [path, loader] of Object.entries(rawFiles)) {
    const raw = (await loader()) as string
    const { data, content } = parseFrontMatter(raw)

    const filename = path.split("/").pop()!.replace(/\.md$/, "")

    posts.push({
      id: data.id ?? filename,
      title: data.title ?? filename,
      date: data.date ?? "",
      summary: data.summary ?? "",
      cag: data.cag ?? "",
      tags: data.tags ?? [],
      content,
    })
  }

  posts.sort((a, b) => (b.date > a.date ? 1 : -1))
  cachedPosts = posts
  return posts
}

export async function getAllPosts(): Promise<BlogPost[]> {
  return loadAllPosts()
}

export async function getPostById(id: string): Promise<BlogPost | undefined> {
  const posts = await loadAllPosts()
  return posts.find((p) => p.id === id)
}
