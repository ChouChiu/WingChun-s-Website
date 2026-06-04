export interface TocItem {
  id: string
  text: string
  level: number
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/`/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .trim()
}

export function extractHeadings(markdown: string): TocItem[] {
  const headings: TocItem[] = []

  const mdHeadingRegex = /^(#{1,6})\s+(.+)$/gm
  let match

  while ((match = mdHeadingRegex.exec(markdown)) !== null) {
    const level = match[1].length
    const text = match[2]
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`(.*?)`/g, "$1")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .replace(/<[^>]*>/g, "")
      .trim()

    if (!text) continue
    if (level > 3) continue

    const id = slugify(text)

    headings.push({ id, text, level })
  }

  const htmlHeadingRegex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi
  while ((match = htmlHeadingRegex.exec(markdown)) !== null) {
    const level = parseInt(match[1])
    const text = match[2].replace(/<[^>]*>/g, "").trim()

    if (!text || level > 3) continue

    const idMatch = match[0].match(/id="([^"]*)"/)
    const id = idMatch ? idMatch[1] : slugify(text)

    headings.push({ id, text, level })
  }

  return headings
}

export function countWords(content: string): number {
  let text = content

  const frontmatterMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (frontmatterMatch) {
    text = text.slice(frontmatterMatch[0].length)
  }

  const lines = text.split("\n")
  const filteredLines = lines.filter((line) => {
    return !/^#{1,6}\s/.test(line.trim())
  })

  text = filteredLines.join("\n")
  text = text.replace(/```[\s\S]*?```/g, "")
  text = text.replace(/`[^`]*`/g, "")
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, "")
  text = text.replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, "")
  text = text.replace(/<[^>]*>/g, "")
  text = text.replace(/\*\*/g, "")
  text = text.replace(/\*/g, "")
  text = text.replace(/~~/g, "")
  text = text.replace(/==/g, "")

  const chars = text.replace(/\s/g, "")
  return chars.length
}
