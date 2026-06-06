import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import * as cheerio from "cheerio"

declare const Bun: { version: string } | undefined

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, "..")
const OUTPUT_DIR = join(PROJECT_ROOT, "public", "hw-list")

interface HomeworkEntry {
  id: string
  issue_date: string
  due_date: string
  class_group: string
  subject: string
  homework_name: string
  remarks: string
}

class Logger {
  static info(message: string) {
    console.log(`::notice::${message}`)
  }

  static success(message: string) {
    console.log(`::notice title=成功::${message}`)
  }

  static warning(message: string) {
    console.log(`::warning::${message}`)
  }

  static error(message: string) {
    console.log(`::error::${message}`)
  }

  static group(title: string) {
    console.log(`::group::${title}`)
  }

  static endgroup() {
    console.log("::endgroup::")
  }
}

const cookies = new Map<string, string>()

function getCookies(): string {
  return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ")
}

function storeCookies(response: Response) {
  const setCookie = response.headers.getSetCookie()
  for (const header of setCookie) {
    const pair = header.split(";")[0]
    if (pair) {
      const eqIdx = pair.indexOf("=")
      if (eqIdx > 0) {
        const name = pair.slice(0, eqIdx).trim()
        const value = pair.slice(eqIdx + 1).trim()
        cookies.set(name, value)
      }
    }
  }
}

async function portalFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)
  if (!headers.has("User-Agent")) {
    headers.set(
      "User-Agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    )
  }
  const cookieStr = getCookies()
  if (cookieStr) {
    headers.set("Cookie", cookieStr)
  }

  const response = await fetch(url, {
    ...init,
    headers,
    redirect: "follow",
  })

  storeCookies(response)
  return response
}

function getCredentials(): [string, string] | null {
  const username = process.env.PORTAL_USERNAME
  const password = process.env.PORTAL_PASSWORD

  if (!username || !password) {
    Logger.error("無法從環境變數取得登入憑證")
    Logger.error("請設定 PORTAL_USERNAME 和 PORTAL_PASSWORD 環境變數")
    return null
  }

  Logger.info("成功從環境變數取得登入憑證")
  return [username, password]
}

async function loginToPortal(
  username: string,
  password: string
): Promise<boolean> {
  const loginUrl = "https://portal.frcss.edu.hk/user.php?op=login"

  try {
    Logger.info("正在登入...")

    const body = new URLSearchParams({
      uname: username,
      pass: password,
      op: "login",
      xoops_redirect: "",
      from: "profile",
    })

    const response = await portalFetch(loginUrl, {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    })

    const text = await response.text()

    if (text.includes("登入") && text.includes("帳號")) {
      Logger.error("登入失敗：用戶名稱或密碼錯誤")
      return false
    }

    Logger.success("登入成功！")
    return true
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      Logger.error("連接錯誤：無法連接到入口門戶")
    } else {
      Logger.error(`登入過程中出現錯誤: ${error}`)
    }
    return false
  }
}

function cleanSubjectName(subjectText: string): string {
  const pattern = /^(.+?)\s*--\s*([A-Za-z_]+)$/
  const match = subjectText.match(pattern)

  if (match) {
    const chineseName = match[1].trim()
    let englishCode = match[2].trim().toUpperCase()

    if (englishCode.length % 2 === 0) {
      const halfLength = englishCode.length / 2
      if (englishCode.slice(0, halfLength) === englishCode.slice(halfLength)) {
        englishCode = englishCode.slice(0, halfLength)
      }
    }

    return `${chineseName} -- ${englishCode}`
  }

  const splitMatch = subjectText.match(/^([\u4e00-\u9fff]+)[a-z_]+$/)
  if (splitMatch) {
    return splitMatch[1].trim()
  }

  return subjectText
}

async function getHomeworkByDate(dateStr: string): Promise<string | null> {
  const ajaxUrl = "https://portal.frcss.edu.hk/modules/clsrm/clsrm_hw_oper.php"

  const body = new URLSearchParams({
    oper: "hw_tbl",
    slt_term: "1",
    slt_subj: "",
    slt_date: dateStr,
    slt_tide: "create",
  })

  try {
    Logger.info(`正在取得 ${dateStr} 的家課資料...`)

    const response = await portalFetch(ajaxUrl, {
      method: "POST",
      body,
      headers: {
        Referer: "https://portal.frcss.edu.hk/modules/clsrm/?md=hw",
        "X-Requested-With": "XMLHttpRequest",
      },
    })

    if (!response.ok) {
      Logger.error(`請求失敗，狀態碼: ${response.status}`)
      return null
    }

    const result = (await response.json()) as { html?: string }
    const htmlContent = result.html

    if (htmlContent) {
      Logger.success(`成功取得 ${dateStr} 的家課資料`)
    } else {
      Logger.info(`${dateStr} 沒有家課資料`)
    }

    return htmlContent ?? null
  } catch (error) {
    Logger.error(`取得 ${dateStr} 家課資料失敗: ${error}`)
    return null
  }
}

function parseHomeworkData(htmlContent: string): HomeworkEntry[] {
  if (!htmlContent) return []

  const $ = cheerio.load(htmlContent)
  const homeworkData: HomeworkEntry[] = []
  const table = $("table#hw_table")

  if (table.length > 0) {
    const rows = table.find("tr").slice(1)
    rows.each((_i, row) => {
      const cells = $(row).find("td")
      if (cells.length >= 7) {
        homeworkData.push({
          id: $(cells[0]).text().trim(),
          issue_date: $(cells[1]).text().trim(),
          due_date: $(cells[2]).text().trim(),
          class_group: $(cells[3]).text().trim(),
          subject: cleanSubjectName($(cells[4]).text().trim()),
          homework_name: $(cells[5]).text().trim(),
          remarks: $(cells[6]).text().trim(),
        })
      }
    })
    Logger.success(`取得 ${homeworkData.length} 條家課記錄`)
  } else {
    Logger.warning("未找到家課表格")
  }

  return homeworkData
}

function getDateRange(): string[] {
  const currentYear = 2025
  const startDate = new Date(currentYear, 8, 1) // Sept 1
  const endDate = new Date()

  const dateList: string[] = []
  const current = new Date(startDate)

  while (current <= endDate) {
    const y = current.getFullYear()
    const m = String(current.getMonth() + 1).padStart(2, "0")
    const d = String(current.getDate()).padStart(2, "0")
    dateList.push(`${y}-${m}-${d}`)
    current.setDate(current.getDate() + 1)
  }

  return dateList
}

function escapeCsvField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

async function saveDataToCsv(homeworkData: HomeworkEntry[]): Promise<boolean> {
  await mkdir(OUTPUT_DIR, { recursive: true })
  const filename = join(OUTPUT_DIR, "homework_data.csv")

  if (homeworkData.length === 0) {
    Logger.warning("沒有資料可儲存")
    return false
  }

  try {
    const fields: (keyof HomeworkEntry)[] = [
      "id",
      "issue_date",
      "due_date",
      "class_group",
      "subject",
      "homework_name",
      "remarks",
    ]

    const header = fields.join(",")
    const rows = homeworkData.map((entry) =>
      fields.map((f) => escapeCsvField(entry[f])).join(",")
    )

    const csv = [header, ...rows].join("\n") + "\n"
    await writeFile(filename, csv, "utf-8")

    Logger.success(`資料已儲存到 ${filename}: ${homeworkData.length} 條記錄`)
    return true
  } catch (error) {
    Logger.error(`儲存資料失敗: ${error}`)
    return false
  }
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
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
        fields.push(current)
        current = ""
      } else {
        current += ch
      }
    }
  }
  fields.push(current)
  return fields
}

async function readExistingCsv(): Promise<HomeworkEntry[]> {
  const filename = join(OUTPUT_DIR, "homework_data.csv")
  try {
    const content = await readFile(filename, "utf-8")
    const lines = content.replace(/\r/g, "").trim().split("\n")
    if (lines.length <= 1) return []

    const header = parseCsvLine(lines[0])
    return lines.slice(1).map((line) => {
      const values = parseCsvLine(line)
      const entry: Record<string, string> = {}
      for (let i = 0; i < header.length; i++) {
        entry[header[i]] = values[i]?.trim() ?? ""
      }
      return entry as unknown as HomeworkEntry
    })
  } catch {
    return []
  }
}

async function main(): Promise<HomeworkEntry[]> {
  Logger.group("家課資料爬蟲開始執行")

  const creds = getCredentials()
  if (!creds) return []

  const [username, password] = creds
  const loggedIn = await loginToPortal(username, password)
  if (!loggedIn) return []

  const forceFullUpdate =
    process.env.FORCE_FULL_UPDATE?.toLowerCase() === "true"

  if (forceFullUpdate) {
    Logger.info("強制完整更新模式已啟用")
  }

  let homeworkData: HomeworkEntry[]

  const dataFile = join(OUTPUT_DIR, "homework_data.csv")
  let dataFileExists = true
  try {
    await readFile(dataFile)
  } catch {
    dataFileExists = false
  }

  if (forceFullUpdate || !dataFileExists) {
    Logger.info("取得從9月1日至現時的所有家課資料...")
    const dateList = getDateRange()
    Logger.info(`將查詢 ${dateList.length} 天的家課資料`)

    homeworkData = []
    for (let i = 0; i < dateList.length; i++) {
      const dateStr = dateList[i]
      if (i % 10 === 0) {
        Logger.info(`查詢進度: ${i + 1}/${dateList.length} - ${dateStr}`)
      }

      const homeworkHtml = await getHomeworkByDate(dateStr)
      if (homeworkHtml) {
        const dailyHomework = parseHomeworkData(homeworkHtml)
        homeworkData.push(...dailyHomework)
      }
    }

    Logger.success(`完整更新完成，共取得 ${homeworkData.length} 條記錄`)
  } else {
    Logger.info("增量更新模式")

    const existingData = await readExistingCsv()
    const existingIds = new Set(
      existingData.map((item) => item.id).filter(Boolean)
    )

    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, "0")
    const d = String(today.getDate()).padStart(2, "0")
    const todayStr = `${y}-${m}-${d}`

    const homeworkHtml = await getHomeworkByDate(todayStr)
    const newHomework = homeworkHtml ? parseHomeworkData(homeworkHtml) : []

    let newCount = 0
    for (const item of newHomework) {
      if (!existingIds.has(item.id)) {
        existingData.push(item)
        newCount++
      }
    }

    homeworkData = existingData
    Logger.success(
      `新增 ${newCount} 條記錄，總計 ${homeworkData.length} 條記錄`
    )
  }

  if (homeworkData.length > 0) {
    await saveDataToCsv(homeworkData)
    Logger.info("資料摘要:")
    Logger.info(`  - 總記錄數: ${homeworkData.length}`)

    const subjectCounts: Record<string, number> = {}
    for (const item of homeworkData) {
      const subject = item.subject || "未知"
      subjectCounts[subject] = (subjectCounts[subject] ?? 0) + 1
    }

    Logger.info("  - 科目統計:")
    for (const [subject, count] of Object.entries(subjectCounts)) {
      Logger.info(`    - ${subject}: ${count} 項`)
    }

    const todayDt = new Date()
    let upcomingCount = 0
    for (const item of homeworkData) {
      const dueDateStr = item.due_date
      if (!dueDateStr) continue
      try {
        const dueDate = new Date(dueDateStr)
        const diffDays =
          (dueDate.getTime() - todayDt.getTime()) / (1000 * 60 * 60 * 24)
        if (diffDays >= 0 && diffDays <= 3) {
          upcomingCount++
        }
      } catch {
        void 0
      }
    }

    if (upcomingCount > 0) {
      Logger.warning(`有 ${upcomingCount} 項作業在未來3天內到期`)
    }
  } else {
    Logger.warning("沒有取得家課資料")
  }

  Logger.endgroup()
  return homeworkData
}

const startTime = Date.now()
const homeworkData = await main()
const endTime = Date.now()

Logger.info(`執行時間: ${((endTime - startTime) / 1000).toFixed(1)}s`)
Logger.info(`完成狀態: ${homeworkData.length > 0 ? "成功" : "失敗"}`)

Logger.group("環境資訊")
Logger.info(
  `執行時間: ${new Date().toISOString().replace("T", " ").slice(0, 19)}`
)
Logger.info(
  `Runtime: ${typeof Bun !== "undefined" ? `Bun ${Bun.version}` : `Node ${process.version}`}`
)
Logger.endgroup()
