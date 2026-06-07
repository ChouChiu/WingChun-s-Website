"use client"

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
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/utils"
import { type HwItem, loadHomeworkData } from "../data/homework"
import {
  countDueBy,
  countIssuedBy,
  extractSubjects,
  filterHomework,
  getHomeworkStatus,
  getTodayYMD,
  type HwStatus,
} from "../lib/homework"

function StatusBadge({
  status,
}: {
  status: ReturnType<typeof getHomeworkStatus>
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 font-semibold text-xs",
        status.cls === "overdue" &&
          "border border-destructive/20 bg-destructive/10 text-destructive",
        status.cls === "today" &&
          "border border-primary/20 bg-primary/10 text-primary",
        status.cls === "future" &&
          "border border-border/60 bg-muted text-muted-foreground"
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
        <div className="font-medium text-muted-foreground text-xs">{label}</div>
        <div className="font-bold text-xl">{value}</div>
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
    <div>
      {/* Header */}
      <div className="stagger-1 mb-6 flex animate-fade-in-up items-center justify-between">
        <h1 className="font-bold font-heading text-2xl">作業列表</h1>
      </div>

      {/* Filters */}
      <div className="stagger-2 mb-4 grid animate-fade-in-up gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label className="font-medium text-muted-foreground text-xs">
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
          <label className="font-medium text-muted-foreground text-xs">
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
          <label className="font-medium text-muted-foreground text-xs">
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
      <div className="stagger-3 mb-5 animate-fade-in-up">
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="mr-1.5 size-3.5" />
          重置篩選
        </Button>
      </div>

      {/* Stats */}
      <div className="stagger-4 mb-5 grid animate-fade-in-up gap-3 sm:grid-cols-2">
        <StatCard icon={BookOpen} label="發佈功課" value={issuedCount} />
        <StatCard icon={Calendar} label="截止功課" value={dueCount} />
      </div>

      {/* Table */}
      <div className="stagger-5 animate-fade-in-up overflow-hidden rounded-xl border border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border/60 border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  科目
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  作業
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  發佈
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  截止
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  班級
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  狀態
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">
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
                        "border-border/40 border-b transition-colors hover:bg-muted/30",
                        idx % 2 === 1 && "bg-muted/10",
                        status.cls === "overdue" &&
                          "bg-destructive/5 hover:bg-destructive/10",
                        status.cls === "today" &&
                          "bg-primary/5 hover:bg-primary/10"
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
      <div className="stagger-5 mt-3 animate-fade-in-up text-right text-muted-foreground text-xs">
        共 {filtered.length} 項作業
      </div>
    </div>
  )
}
