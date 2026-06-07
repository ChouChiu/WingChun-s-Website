import fs from "fs"
import matter from "gray-matter"
import path from "path"

export interface BlogPost {
  id: string
  title: string
  date: string
  summary: string
  cag: string
  tags: string[]
  content: string
}

const POSTS_DIR = path.join(process.cwd(), "src/contents/blogs")

let cachedPosts: BlogPost[] | null = null

export function getAllPosts(): BlogPost[] {
  if (cachedPosts) return cachedPosts

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"))

  cachedPosts = files
    .map((filename) => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, filename), "utf8")
      const { data, content } = matter(raw)

      return {
        id: data.id || filename.replace(".md", ""),
        title: data.title || filename,
        date:
          data.date instanceof Date
            ? data.date.toISOString().split("T")[0]
            : String(data.date || ""),
        summary: data.summary || "",
        cag: data.cag || "",
        tags: data.tags || [],
        content,
      }
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return cachedPosts
}

export function getPostById(id: string): BlogPost | undefined {
  return getAllPosts().find((post) => post.id === id)
}
