import { useState, useMemo, useEffect } from "react"
import { loadHomeworkData, type HwItem } from "../data/homework"
import {
  extractSubjects,
  filterHomework,
  getHomeworkStatus,
  countIssuedBy,
  countDueBy,
  getTodayYMD,
  type HwStatus,
} from "../lib/homework"
import { Button } from "@/shared/components/ui/button"
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  Filter,
  Loader2,
  RotateCcw,
} from "lucide-react"
import { cn } from "@/shared/lib/utils"

function StatusBadge({ status }: { status: ReturnType<typeof getHomeworkStatus> }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        status.cls === "overdue" &&
          "bg-destructive/10 text-destructive border border-destructive/20",
        status.cls === "today" &&
          "bg-primary/10 text-primary border border-primary/20",
        status.cls === "future" &&
          "bg-muted text-muted-foreground border border-border/60"
      )}
    >
      {status.cls === "overdue" && <AlertCircle className="size-3" />}
      {status.cls === "today" && <Clock className="size-3" />}
      {status.cls === "future" && <ArrowRight className="size-3" />}
      {status.text}
    </span>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 transition-colors hover:border-border">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <Icon className="size-5" />
      </div>
      <div>
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="text-xl font-bold">{value}</div>
      </div>
    </div>
  )
}

export function HwListPage() {
  const [items, setItems] = useState<HwItem[]>([])
  const [loading, setLoading] = useState(true)
  const [issueDate, setIssueDate] = useState(getTodayYMD())
  const [subject, setSubject] = useState("")
  const [dueStatus, setDueStatus] = useState("")

  useEffect(() => {
    loadHomeworkData().then((data) => {
      setItems(data)
      setLoading(false)
    })
  }, [])

  const subjects = useMemo(() => extractSubjects(items), [items])

  const filtered = useMemo(
    () =>
      filterHomework(items, {
        issueDate: issueDate || undefined,
        subject: subject || undefined,
        dueStatus: (dueStatus || undefined) as HwStatus | undefined,
      }),
    [items, issueDate, subject, dueStatus]
  )

  const issuedCount = useMemo(
    () => countIssuedBy(items, issueDate),
    [items, issueDate]
  )
  const dueCount = useMemo(
    () => countDueBy(items, issueDate),
    [items, issueDate]
  )

  const handleReset = () => {
    setIssueDate(getTodayYMD())
    setSubject("")
    setDueStatus("")
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span>加載中…</span>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1060px]">
      {/* Header */}
      <div className="animate-fade-in-up stagger-1 mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">作業列表</h1>
      </div>

      {/* Filters */}
      <div className="animate-fade-in-up stagger-2 mb-4 grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            發佈日期
          </label>
          <input
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            科目
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
          >
            <option value="">全部</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            截止狀態
          </label>
          <select
            value={dueStatus}
            onChange={(e) => setDueStatus(e.target.value)}
            className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
          >
            <option value="">全部</option>
            <option value="overdue">已過期</option>
            <option value="today">今天到期</option>
            <option value="future">進行中</option>
          </select>
        </div>
      </div>

      {/* Reset */}
      <div className="animate-fade-in-up stagger-3 mb-5">
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="mr-1.5 size-3.5" />
          重置篩選
        </Button>
      </div>

      {/* Stats */}
      <div className="animate-fade-in-up stagger-4 mb-5 grid gap-3 sm:grid-cols-2">
        <StatCard icon={BookOpen} label="發佈功課" value={issuedCount} />
        <StatCard icon={Calendar} label="截止功課" value={dueCount} />
      </div>

      {/* Table */}
      <div className="animate-fade-in-up stagger-5 overflow-hidden rounded-xl border border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  科目
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  作業
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  發佈
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  截止
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  班級
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  狀態
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  備註
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    <Filter className="mx-auto mb-2 size-8 opacity-40" />
                    沒有符合條件的作業
                  </td>
                </tr>
              ) : (
                filtered.map((it, idx) => {
                  const status = getHomeworkStatus(it.due_date)
                  return (
                    <tr
                      key={it.id}
                      className={cn(
                        "border-b border-border/40 transition-colors hover:bg-muted/30",
                        idx % 2 === 1 && "bg-muted/10",
                        status.cls === "overdue" && "bg-destructive/5 hover:bg-destructive/10",
                        status.cls === "today" && "bg-primary/5 hover:bg-primary/10"
                      )}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {it.id}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium">
                        {it.subject}
                      </td>
                      <td className="px-4 py-3">{it.homework_name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {it.issue_date}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {it.due_date}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {it.class_group || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={status} />
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-muted-foreground">
                        {it.remarks || "—"}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Count */}
      <div className="animate-fade-in-up stagger-5 mt-3 text-right text-xs text-muted-foreground">
        共 {filtered.length} 項作業
      </div>
    </div>
  )
}
