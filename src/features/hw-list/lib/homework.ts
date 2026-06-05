import type { HwItem } from "../data/homework"

export type HwStatus = "overdue" | "today" | "future"

export interface HwStatusInfo {
  cls: HwStatus
  text: string
  icon: string
}

export function getHomeworkStatus(dueDateStr: string): HwStatusInfo {
  const due = new Date(dueDateStr)
  const today = new Date()

  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)

  if (due < today) {
    return { cls: "overdue", text: "已過期", icon: "alert-circle" }
  }
  if (due.getTime() === today.getTime()) {
    return { cls: "today", text: "今天到期", icon: "clock" }
  }
  return { cls: "future", text: "進行中", icon: "arrow-right" }
}

export function extractSubjects(items: HwItem[]): string[] {
  return Array.from(new Set(items.map((i) => i.subject))).sort()
}

export function countIssuedBy(items: HwItem[], dateYmd: string): number {
  return items.filter((i) => i.issue_date === dateYmd).length
}

export function countDueBy(items: HwItem[], dateYmd: string): number {
  return items.filter((i) => i.due_date === dateYmd).length
}

export function filterHomework(
  items: HwItem[],
  options: {
    issueDate?: string
    subject?: string
    dueStatus?: HwStatus
  }
): HwItem[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return items.filter((it) => {
    if (options.issueDate && it.issue_date !== options.issueDate) return false
    if (options.subject && it.subject !== options.subject) return false

    if (options.dueStatus) {
      const due = new Date(it.due_date)
      due.setHours(0, 0, 0, 0)

      if (options.dueStatus === "overdue" && due >= today) return false
      if (options.dueStatus === "today" && due.getTime() !== today.getTime())
        return false
      if (options.dueStatus === "future" && due <= today) return false
    }

    return true
  })
}

export function getTodayYMD(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`
}
