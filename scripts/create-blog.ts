import { access, readdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import * as p from "@clack/prompts"
import { parse } from "yaml"

const __dirname = dirname(fileURLToPath(import.meta.url))
const BLOGS_DIR = resolve(__dirname, "../src/contents/blogs")

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

async function getAllTags(): Promise<string[]> {
  const files = await readdir(BLOGS_DIR)
  const tagSet = new Set<string>()

  for (const file of files) {
    if (!file.endsWith(".md")) continue
    const raw = await readFile(join(BLOGS_DIR, file), "utf-8")
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
    if (!match) continue
    try {
      const data = parse(match[1]) as { tags?: string[] }
      if (data.tags) {
        for (const tag of data.tags) {
          tagSet.add(tag)
        }
      }
    } catch {
      // skip files with invalid YAML
    }
  }

  return [...tagSet].sort()
}

async function getAllCags(): Promise<string[]> {
  const files = await readdir(BLOGS_DIR)
  const cagSet = new Set<string>()

  for (const file of files) {
    if (!file.endsWith(".md")) continue
    const raw = await readFile(join(BLOGS_DIR, file), "utf-8")
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
    if (!match) continue
    try {
      const data = parse(match[1]) as { cag?: string }
      if (data.cag) {
        cagSet.add(data.cag)
      }
    } catch {
      // skip files with invalid YAML
    }
  }

  return [...cagSet].sort()
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function main() {
  p.intro("Create a new blog post")

  const existingTags = await getAllTags()
  const existingCags = await getAllCags()

  const title = await p.text({
    message: "Post title",
    placeholder: "My New Post",
    validate: (value) => {
      if (!value || value.trim().length === 0) return "Title is required"
    },
  })

  if (p.isCancel(title)) {
    p.cancel("Operation cancelled.")
    process.exit(0)
  }

  const today = new Date().toISOString().split("T")[0]
  const date = await p.text({
    message: "Date",
    defaultValue: today,
    placeholder: today,
  })

  if (p.isCancel(date)) {
    p.cancel("Operation cancelled.")
    process.exit(0)
  }

  const summary = await p.text({
    message: "Summary",
    placeholder: "A brief description of the post",
    validate: (value) => {
      if (!value || value.trim().length === 0) return "Summary is required"
    },
  })

  if (p.isCancel(summary)) {
    p.cancel("Operation cancelled.")
    process.exit(0)
  }

  const cag = await (async (): Promise<string> => {
    if (existingCags.length > 0) {
      const cagChoices = [
        ...existingCags.map((c) => ({ value: c, label: c })),
        { value: "__new__", label: "New category..." },
      ]

      const selected = await p.select({
        message: "Category",
        options: cagChoices,
      })

      if (p.isCancel(selected)) {
        p.cancel("Operation cancelled.")
        process.exit(0)
      }

      if (selected !== "__new__") return selected as string
    }

    const newCag = await p.text({
      message: "Category",
      placeholder: "e.g. 技術, 作文, 公告",
      validate: (value) => {
        if (!value || value.trim().length === 0) return "Category is required"
      },
    })

    if (p.isCancel(newCag)) {
      p.cancel("Operation cancelled.")
      process.exit(0)
    }

    return (newCag as string).trim()
  })()

  let selectedTags: string[] = []
  const newTags: string[] = []

  if (existingTags.length > 0) {
    const tagChoices = existingTags.map((tag) => ({
      value: tag,
      label: tag,
    }))

    const tags = await p.multiselect({
      message: "Select existing tags (or skip)",
      options: tagChoices,
      required: false,
    })

    if (p.isCancel(tags)) {
      p.cancel("Operation cancelled.")
      process.exit(0)
    }

    selectedTags = tags as string[]
  }

  const newTagInput = await p.text({
    message: "Add new tags (comma-separated, or leave empty)",
    placeholder: "tag1, tag2",
  })

  if (p.isCancel(newTagInput)) {
    p.cancel("Operation cancelled.")
    process.exit(0)
  }

  if (newTagInput && newTagInput.trim()) {
    newTags.push(
      ...newTagInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    )
  }

  const allTags = [...new Set([...selectedTags, ...newTags])]
  const autoSlug = slugify(title as string)

  const id = await p.text({
    message: "ID (leave empty to auto-generate)",
    placeholder: autoSlug,
    defaultValue: autoSlug,
  })

  if (p.isCancel(id)) {
    p.cancel("Operation cancelled.")
    process.exit(0)
  }

  const slug = (id as string).trim() || autoSlug
  const filePath = join(BLOGS_DIR, `${slug}.md`)

  if (await fileExists(filePath)) {
    const overwrite = await p.confirm({
      message: `File ${slug}.md already exists. Overwrite?`,
      initialValue: false,
    })

    if (p.isCancel(overwrite) || !overwrite) {
      p.cancel("Operation cancelled.")
      process.exit(0)
    }
  }

  const frontMatter = [
    "---",
    `id: "${slug}"`,
    `title: "${title}"`,
    `date: "${date}"`,
    `summary: "${summary}"`,
    `cag: "${cag}"`,
    `tags: [${allTags.join(", ")}]`,
    "---",
  ].join("\n")

  const content = `${frontMatter}\n\n# ${title}\n\n<!-- Write your content here. -->\n`

  await writeFile(filePath, content, "utf-8")

  p.outro(`Created ${slug}.md`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
