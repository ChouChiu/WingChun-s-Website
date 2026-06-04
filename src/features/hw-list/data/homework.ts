export interface HwItem {
  id: string
  subject: string
  homework_name: string
  issue_date: string
  due_date: string
  class_group?: string
  remarks?: string
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ",") {
        result.push(current)
        current = ""
      } else {
        current += ch
      }
    }
  }
  result.push(current)
  return result
}

function parseCsv(text: string): HwItem[] {
  const lines = text.trim().split("\n")
  if (lines.length < 2) return []

  const items: HwItem[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])
    if (cols.length >= 6) {
      items.push({
        id: cols[0],
        issue_date: cols[1],
        due_date: cols[2],
        class_group: cols[3] || undefined,
        subject: cols[4],
        homework_name: cols[5],
        remarks: cols[6] || undefined,
      })
    }
  }
  return items
}

export async function loadHomeworkData(): Promise<HwItem[]> {
  try {
    const res = await fetch("/hw-list/homework_data.csv", { cache: "no-store" })
    if (!res.ok) return []
    const text = await res.text()
    return parseCsv(text)
  } catch {
    return []
  }
}
