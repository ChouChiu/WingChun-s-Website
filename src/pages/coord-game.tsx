import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Phase = "start" | "playing" | "transition" | "results"
type Mode = "simple" | "challenge" | "hell" | "final"
type AnsState = "idle" | "correct" | "wrong" | "timeout"
type QType = "identify" | "area" | "reflection" | "translation"

interface GraphPoint {
  x: number
  y: number
  label?: string
  color?: string
  showCoords?: boolean
}

interface Question {
  type: QType
  target?: GraphPoint
  refs?: GraphPoint[]
  shape?: GraphPoint[]
  reflectionAxis?: "x" | "y" | "origin"
  originalPoint?: GraphPoint
  reflectedPoint?: GraphPoint
  translation?: { dx: number; dy: number }
  translatedPoint?: GraphPoint
  choices: string[]
  correctIdx: number
  prompt: string
}

const RANGE = 10
const MODES: Mode[] = ["simple", "challenge", "hell", "final"]

const MODE_CFG: Record<
  Mode,
  { time: number; choices: number; questions: number; grid: boolean; nums: boolean }
> = {
  simple: { time: 20, choices: 3, questions: 3, grid: true, nums: true },
  challenge: { time: 10, choices: 5, questions: 3, grid: false, nums: true },
  hell: { time: 10, choices: 7, questions: 3, grid: false, nums: false },
  final: { time: 0, choices: 5, questions: 6, grid: false, nums: false },
}

const POINTS_PER_MODE: Record<Mode, number> = {
  simple: 10,
  challenge: 20,
  hell: 30,
  final: 50,
}

const MODE_LABELS: Record<Mode, string> = {
  simple: "Simple",
  challenge: "Challenge",
  hell: "Hell",
  final: "Final Challenge",
}

const TRANSITION_MSG: Record<string, { title: string; sub: string }> = {
  challenge: {
    title: "Level Up!",
    sub: "Entering Challenge Mode — Grid lines removed!",
  },
  hell: {
    title: "Impressive!",
    sub: "Welcome to Hell Mode — No grid, no number labels!",
  },
  final: {
    title: "Final Challenge!",
    sub: "Mixed problems: area, identify, reflection & translation. No time limit — speed is rewarded!",
  },
}

const TIPS: Record<Mode, string[]> = {
  simple: [
    "Use the grid lines and number labels to help identify coordinates.",
    "Remember: (x, y) where x is horizontal and y is vertical.",
    "Start at the origin and count steps: right/left for x, up/down for y.",
  ],
  challenge: [
    "Grid lines are removed! Count carefully from the axes.",
    "Use the tick marks to find exact positions.",
    "Trace horizontally from the y-axis, then vertically from the x-axis.",
  ],
  hell: [
    "Use reference points A and B to deduce P's position.",
    "Look at shared coordinates to narrow down the answer.",
    "If A shares x with P, focus only on y changes.",
  ],
  final: [],
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function makeCoordDistractors(cx: number, cy: number, count: number): string[] {
  const correct = `(${cx}, ${cy})`
  const seen = new Set<string>([correct])
  const pool: [number, number][] = (
    [
      [cy, cx],
      [-cx, cy],
      [cx, -cy],
      [-cx, -cy],
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
      [cx + 2, cy],
      [cx - 2, cy],
      [cx, cy + 2],
      [cx, cy - 2],
      [cx + 1, cy + 1],
      [cx - 1, cy - 1],
      [cx + 1, cy - 1],
      [cx - 1, cy + 1],
    ] as [number, number][]
  ).filter(([x, y]) => Math.abs(x) <= RANGE && Math.abs(y) <= RANGE)

  const result: string[] = []
  for (const [x, y] of shuffle(pool)) {
    const s = `(${x}, ${y})`
    if (!seen.has(s)) {
      result.push(s)
      seen.add(s)
    }
    if (result.length >= count) return result
  }
  while (result.length < count) {
    const rx = randInt(-RANGE + 1, RANGE - 1)
    const ry = randInt(-RANGE + 1, RANGE - 1)
    const s = `(${rx}, ${ry})`
    if (!seen.has(s)) {
      result.push(s)
      seen.add(s)
    }
  }
  return result
}

function genIdentifyQ(numChoices: number, hell: boolean): Question {
  let tx = 0,
    ty = 0
  while (tx === 0 && ty === 0) {
    tx = randInt(-RANGE + 2, RANGE - 2)
    ty = randInt(-RANGE + 2, RANGE - 2)
  }
  const target: GraphPoint = { x: tx, y: ty, label: "P", color: "#479ef5" }
  const refs: GraphPoint[] = []
  if (hell) {
    let ry1 = ty
    while (Math.abs(ry1 - ty) < 2) ry1 = randInt(-RANGE + 1, RANGE - 1)
    refs.push({ x: tx, y: ry1, label: "A", color: "#ff9800", showCoords: true })
    let rx2 = tx
    while (Math.abs(rx2 - tx) < 2) rx2 = randInt(-RANGE + 1, RANGE - 1)
    refs.push({ x: rx2, y: ty, label: "B", color: "#ff9800", showCoords: true })
  }
  const correctStr = `(${tx}, ${ty})`
  const distractors = makeCoordDistractors(tx, ty, numChoices - 1)
  const all = shuffle([correctStr, ...distractors])
  return {
    type: "identify",
    target,
    refs: refs.length > 0 ? refs : undefined,
    choices: all,
    correctIdx: all.indexOf(correctStr),
    prompt: "What are the coordinates of point P?",
  }
}

function genReflectionQ(numChoices: number): Question {
  let ox = 0,
    oy = 0
  while (ox === 0 || oy === 0) {
    ox = randInt(-RANGE + 2, RANGE - 2)
    oy = randInt(-RANGE + 2, RANGE - 2)
  }
  const axes: Array<"x" | "y" | "origin"> = ["x", "y", "origin"]
  const axis = axes[randInt(0, 2)]
  let rx: number, ry: number, axisLabel: string
  if (axis === "x") {
    rx = ox
    ry = -oy
    axisLabel = "x-axis"
  } else if (axis === "y") {
    rx = -ox
    ry = oy
    axisLabel = "y-axis"
  } else {
    rx = -ox
    ry = -oy
    axisLabel = "origin"
  }
  const originalPoint: GraphPoint = {
    x: ox,
    y: oy,
    label: "P",
    color: "#479ef5",
    showCoords: true,
  }
  const reflectedPoint: GraphPoint = {
    x: rx,
    y: ry,
    label: "P'",
    color: "#a855f7",
  }
  const correctStr = `(${rx}, ${ry})`
  const distractors = makeCoordDistractors(rx, ry, numChoices - 1)
  const all = shuffle([correctStr, ...distractors])
  const prompt =
    axis === "origin"
      ? "Point P is reflected about the origin. What are the coordinates of P'?"
      : `Point P is reflected across the ${axisLabel}. What are the coordinates of P'?`
  return {
    type: "reflection",
    originalPoint,
    reflectedPoint,
    reflectionAxis: axis,
    choices: all,
    correctIdx: all.indexOf(correctStr),
    prompt,
  }
}

function genTranslationQ(numChoices: number): Question {
  let ox = 0,
    oy = 0
  while (ox === 0 && oy === 0) {
    ox = randInt(-RANGE + 3, RANGE - 3)
    oy = randInt(-RANGE + 3, RANGE - 3)
  }
  const dx = randInt(-3, 3)
  const dy = randInt(-3, 3)
  if (dx === 0 && dy === 0) return genTranslationQ(numChoices)
  const tx = ox + dx
  const ty = oy + dy
  if (Math.abs(tx) > RANGE - 1 || Math.abs(ty) > RANGE - 1)
    return genTranslationQ(numChoices)
  const originalPoint: GraphPoint = {
    x: ox,
    y: oy,
    label: "P",
    color: "#479ef5",
    showCoords: true,
  }
  const translatedPoint: GraphPoint = {
    x: tx,
    y: ty,
    label: "P'",
    color: "#a855f7",
  }
  const correctStr = `(${tx}, ${ty})`
  const distractors = makeCoordDistractors(tx, ty, numChoices - 1)
  const all = shuffle([correctStr, ...distractors])
  const dxStr = dx >= 0 ? `+${dx}` : `${dx}`
  const dyStr = dy >= 0 ? `+${dy}` : `${dy}`
  return {
    type: "translation",
    originalPoint,
    translatedPoint,
    translation: { dx, dy },
    choices: all,
    correctIdx: all.indexOf(correctStr),
    prompt: `Point P is translated by (${dxStr}, ${dyStr}). What are the coordinates of P'?`,
  }
}

function genRectAreaQ(): Question {
  const rw = randInt(2, 5),
    rh = randInt(2, 5)
  const x1 = randInt(-RANGE + 1, RANGE - rw - 1)
  const y1 = randInt(-RANGE + 1, RANGE - rh - 1)
  const area = rw * rh
  const pts: GraphPoint[] = [
    { x: x1, y: y1, label: "A", color: "#479ef5", showCoords: true },
    { x: x1 + rw, y: y1, label: "B", color: "#479ef5", showCoords: true },
    { x: x1 + rw, y: y1 + rh, label: "C", color: "#479ef5", showCoords: true },
    { x: x1, y: y1 + rh, label: "D", color: "#479ef5", showCoords: true },
  ]
  return buildAreaQ(area, pts, "Calculate the area of rectangle ABCD.")
}

function genTriAreaQ(): Question {
  let base = randInt(2, 6)
  const height = randInt(2, 6)
  if (base % 2 !== 0 && height % 2 !== 0) base += 1
  const ax = randInt(-RANGE + 1, RANGE - base - 1)
  const ay = randInt(-RANGE + 1, RANGE - height - 1)
  if (ax + base > RANGE - 1 || ay + height > RANGE - 1) return genRectAreaQ()
  const area = (base * height) / 2
  const pts: GraphPoint[] = [
    { x: ax, y: ay, label: "A", color: "#479ef5", showCoords: true },
    { x: ax + base, y: ay, label: "B", color: "#479ef5", showCoords: true },
    { x: ax, y: ay + height, label: "C", color: "#479ef5", showCoords: true },
  ]
  return buildAreaQ(area, pts, "Calculate the area of triangle ABC.")
}

function buildAreaQ(
  area: number,
  shapePoints: GraphPoint[],
  prompt: string
): Question {
  const seen = new Set<number>([area])
  const pool = [
    area + 1, area - 1, area + 2, area - 2, area * 2,
    Math.ceil(area / 2), area + 3, area - 3, area + 5, area + 4,
  ].filter((v) => v > 0)
  const dists: number[] = []
  for (const c of shuffle(pool)) {
    if (!seen.has(c)) {
      dists.push(c)
      seen.add(c)
    }
    if (dists.length >= 4) break
  }
  let fill = 6
  while (dists.length < 4) {
    const v = area + fill
    if (v > 0 && !seen.has(v)) {
      dists.push(v)
      seen.add(v)
    }
    fill++
  }
  const correctStr = String(area)
  const all = shuffle([correctStr, ...dists.map(String)])
  return {
    type: "area",
    shape: shapePoints,
    choices: all,
    correctIdx: all.indexOf(correctStr),
    prompt,
  }
}

function genFinalQ(idx: number): Question {
  const typeIdx = idx % 6
  switch (typeIdx) {
    case 0:
      return genRectAreaQ()
    case 1:
      return genIdentifyQ(5, true)
    case 2:
      return genReflectionQ(5)
    case 3:
      return genTranslationQ(5)
    case 4:
      return genTriAreaQ()
    case 5:
      return genReflectionQ(5)
    default:
      return genIdentifyQ(5, true)
  }
}

function genHellQ(idx: number, numChoices: number): Question {
  const typeIdx = idx % 3
  switch (typeIdx) {
    case 0:
      return genIdentifyQ(numChoices, true)
    case 1:
      return genReflectionQ(numChoices)
    case 2:
      return genTranslationQ(numChoices)
    default:
      return genIdentifyQ(numChoices, true)
  }
}

function drawGraph(
  canvas: HTMLCanvasElement,
  opts: {
    showGrid: boolean
    showNumbers: boolean
    points: GraphPoint[]
    edges?: [GraphPoint, GraphPoint][]
    reflectionAxis?: "x" | "y" | "origin"
    translation?: { dx: number; dy: number }
    translationFrom?: GraphPoint
    translationTo?: GraphPoint
  }
) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  const dpr = window.devicePixelRatio || 1
  const w = canvas.width / dpr
  const h = canvas.height / dpr
  const pad = 32
  const gSize = Math.min(w - pad * 2, h - pad * 2)
  const ox = (w - gSize) / 2
  const oy = (h - gSize) / 2
  const unit = gSize / (RANGE * 2)
  const cx = ox + gSize / 2
  const cy = oy + gSize / 2
  const toP = (gx: number, gy: number): [number, number] => [
    cx + gx * unit,
    cy - gy * unit,
  ]

  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = "rgba(255,255,255,0.02)"
  ctx.fillRect(ox, oy, gSize, gSize)

  if (opts.showGrid) {
    ctx.save()
    ctx.strokeStyle = "rgba(255,255,255,0.07)"
    ctx.lineWidth = 1
    for (let i = -RANGE; i <= RANGE; i++) {
      if (i === 0) continue
      const [vx] = toP(i, 0)
      ctx.beginPath()
      ctx.moveTo(vx, oy)
      ctx.lineTo(vx, oy + gSize)
      ctx.stroke()
      const [, hy] = toP(0, i)
      ctx.beginPath()
      ctx.moveTo(ox, hy)
      ctx.lineTo(ox + gSize, hy)
      ctx.stroke()
    }
    ctx.restore()
  }

  ctx.save()
  ctx.strokeStyle = "rgba(255,255,255,0.55)"
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(ox, cy)
  ctx.lineTo(ox + gSize, cy)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx, oy)
  ctx.lineTo(cx, oy + gSize)
  ctx.stroke()
  ctx.restore()

  const asz = 7
  ctx.save()
  ctx.fillStyle = "rgba(255,255,255,0.55)"
  ctx.beginPath()
  ctx.moveTo(ox + gSize, cy)
  ctx.lineTo(ox + gSize - asz, cy - asz / 2)
  ctx.lineTo(ox + gSize - asz, cy + asz / 2)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx, oy)
  ctx.lineTo(cx - asz / 2, oy + asz)
  ctx.lineTo(cx + asz / 2, oy + asz)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.strokeStyle = "rgba(255,255,255,0.25)"
  ctx.lineWidth = 1
  for (let i = -RANGE; i <= RANGE; i++) {
    if (i === 0) continue
    const [tx] = toP(i, 0)
    ctx.beginPath()
    ctx.moveTo(tx, cy - 4)
    ctx.lineTo(tx, cy + 4)
    ctx.stroke()
    const [, ty] = toP(0, i)
    ctx.beginPath()
    ctx.moveTo(cx - 4, ty)
    ctx.lineTo(cx + 4, ty)
    ctx.stroke()
  }
  ctx.restore()

  if (opts.showNumbers) {
    ctx.save()
    ctx.fillStyle = "rgba(255,255,255,0.45)"
    const fontSize = Math.max(10, Math.min(12, unit * 0.45))
    ctx.font = `${fontSize}px system-ui`
    for (let i = -RANGE; i <= RANGE; i++) {
      if (i === 0) continue
      const [nx] = toP(i, 0)
      ctx.textAlign = "center"
      ctx.textBaseline = "top"
      ctx.fillText(String(i), nx, cy + 8)
      const [, ny] = toP(0, i)
      ctx.textAlign = "right"
      ctx.textBaseline = "middle"
      ctx.fillText(String(i), cx - 8, ny)
    }
    ctx.textAlign = "right"
    ctx.textBaseline = "top"
    ctx.fillText("O", cx - 6, cy + 6)
    ctx.restore()
  }

  ctx.save()
  ctx.fillStyle = "rgba(255,255,255,0.35)"
  ctx.font = "italic 13px system-ui"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("x", ox + gSize + 14, cy)
  ctx.fillText("y", cx, oy - 14)
  ctx.restore()

  if (opts.edges && opts.edges.length > 0) {
    ctx.save()
    ctx.strokeStyle = "rgba(71,158,245,0.45)"
    ctx.lineWidth = 2
    ctx.setLineDash([6, 4])
    for (const [p1, p2] of opts.edges) {
      const [x1, y1] = toP(p1.x, p1.y)
      const [x2, y2] = toP(p2.x, p2.y)
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
    ctx.setLineDash([])
    ctx.restore()
    if (opts.edges.length >= 3) {
      ctx.save()
      ctx.fillStyle = "rgba(71,158,245,0.06)"
      ctx.beginPath()
      const [sx, sy] = toP(opts.edges[0][0].x, opts.edges[0][0].y)
      ctx.moveTo(sx, sy)
      for (const [, p2] of opts.edges) {
        const [ex, ey] = toP(p2.x, p2.y)
        ctx.lineTo(ex, ey)
      }
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }
  }

  if (opts.reflectionAxis) {
    ctx.save()
    ctx.strokeStyle = "#a855f7"
    ctx.lineWidth = 2
    ctx.setLineDash([8, 4])
    if (opts.reflectionAxis === "x") {
      ctx.beginPath()
      ctx.moveTo(ox, cy)
      ctx.lineTo(ox + gSize, cy)
      ctx.stroke()
      ctx.fillStyle = "#a855f7"
      ctx.font = "bold 12px system-ui"
      ctx.textAlign = "right"
      ctx.textBaseline = "bottom"
      ctx.fillText("reflection axis", ox + gSize - 4, cy - 6)
    } else if (opts.reflectionAxis === "y") {
      ctx.beginPath()
      ctx.moveTo(cx, oy)
      ctx.lineTo(cx, oy + gSize)
      ctx.stroke()
      ctx.fillStyle = "#a855f7"
      ctx.font = "bold 12px system-ui"
      ctx.textAlign = "left"
      ctx.textBaseline = "top"
      ctx.fillText("reflection axis", cx + 6, oy + 4)
    } else {
      ctx.beginPath()
      ctx.arc(cx, cy, 8, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = "#a855f7"
      ctx.font = "bold 12px system-ui"
      ctx.textAlign = "left"
      ctx.textBaseline = "bottom"
      ctx.fillText("reflect about origin", cx + 12, cy - 4)
    }
    ctx.setLineDash([])
    ctx.restore()
  }

  if (opts.translation && opts.translationFrom && opts.translationTo) {
    const [x1, y1] = toP(opts.translationFrom.x, opts.translationFrom.y)
    const [x2, y2] = toP(opts.translationTo.x, opts.translationTo.y)
    ctx.save()
    ctx.strokeStyle = "#a855f7"
    ctx.lineWidth = 2
    ctx.setLineDash([6, 3])
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
    ctx.setLineDash([])
    const angle = Math.atan2(y2 - y1, x2 - x1)
    const arrowLen = 10
    ctx.beginPath()
    ctx.moveTo(x2, y2)
    ctx.lineTo(
      x2 - arrowLen * Math.cos(angle - Math.PI / 6),
      y2 - arrowLen * Math.sin(angle - Math.PI / 6)
    )
    ctx.moveTo(x2, y2)
    ctx.lineTo(
      x2 - arrowLen * Math.cos(angle + Math.PI / 6),
      y2 - arrowLen * Math.sin(angle + Math.PI / 6)
    )
    ctx.stroke()
    ctx.restore()
  }

  for (const pt of opts.points) {
    const [px, py] = toP(pt.x, pt.y)
    const color = pt.color || "#479ef5"
    ctx.save()
    const grad = ctx.createRadialGradient(px, py, 0, px, py, 14)
    grad.addColorStop(0, `${color}55`)
    grad.addColorStop(1, "transparent")
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(px, py, 14, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    ctx.save()
    ctx.beginPath()
    ctx.arc(px, py, 5, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = "#fff"
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.restore()
    if (pt.label) {
      ctx.save()
      ctx.fillStyle = color
      ctx.font = "bold 14px system-ui"
      ctx.textAlign = "left"
      ctx.textBaseline = "bottom"
      ctx.fillText(pt.label, px + 10, py - 8)
      ctx.restore()
    }
    if (pt.showCoords) {
      ctx.save()
      ctx.fillStyle = "rgba(255,255,255,0.8)"
      ctx.font = "12px system-ui"
      ctx.textAlign = "left"
      ctx.textBaseline = "top"
      ctx.fillText(`(${pt.x}, ${pt.y})`, px + 10, py + 6)
      ctx.restore()
    }
  }
}

export function CoordGamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<Phase>("start")
  const [currentMode, setCurrentMode] = useState<Mode>("simple")
  const [modeQIdx, setModeQIdx] = useState(0)
  const [question, setQuestion] = useState<Question | null>(null)
  const [score, setScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [answerState, setAnswerState] = useState<AnsState>("idle")
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [maxTime, setMaxTime] = useState(0)
  const [finalElapsed, setFinalElapsed] = useState(0)

  const scoreRef = useRef(0)
  const correctRef = useRef(0)
  const wrongRef = useRef(0)
  const modeRef = useRef<Mode>("simple")
  const qIdxRef = useRef(0)
  const answerRef = useRef<AnsState>("idle")
  const timerRef = useRef<number | null>(null)
  const finalStartRef = useRef(0)
  const finalClockRef = useRef<number | null>(null)

  const stopCountdown = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const stopFinalClock = useCallback(() => {
    if (finalClockRef.current !== null) {
      clearInterval(finalClockRef.current)
      finalClockRef.current = null
    }
  }, [])

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const w = Math.max(Math.floor(rect.width), 200)
    const h = Math.max(Math.floor(rect.height), 200)
    canvas.width = w * dpr
    canvas.height = h * dpr
    const ctx = canvas.getContext("2d")
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }, [])

  const renderQ = useCallback(
    (q: Question, mode: Mode) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const c = MODE_CFG[mode]
      const points: GraphPoint[] = []
      let edges: [GraphPoint, GraphPoint][] | undefined
      let reflectionAxis: "x" | "y" | "origin" | undefined
      let translation: { dx: number; dy: number } | undefined
      let translationFrom: GraphPoint | undefined
      let translationTo: GraphPoint | undefined

      if (q.type === "identify") {
        if (q.target)
          points.push({ ...q.target, color: q.target.color || "#479ef5" })
        if (q.refs)
          for (const rp of q.refs)
            points.push({ ...rp, color: rp.color || "#ff9800", showCoords: true })
      } else if (q.type === "area" && q.shape) {
        for (const sp of q.shape)
          points.push({ ...sp, color: sp.color || "#479ef5", showCoords: true })
        edges = []
        for (let i = 0; i < q.shape.length; i++)
          edges.push([q.shape[i], q.shape[(i + 1) % q.shape.length]])
      } else if (q.type === "reflection") {
        if (q.originalPoint) points.push({ ...q.originalPoint })
        if (q.reflectedPoint) points.push({ ...q.reflectedPoint })
        reflectionAxis = q.reflectionAxis
      } else if (q.type === "translation") {
        if (q.originalPoint) points.push({ ...q.originalPoint })
        if (q.translatedPoint) points.push({ ...q.translatedPoint })
        translation = q.translation
        translationFrom = q.originalPoint
        translationTo = q.translatedPoint
      }

      drawGraph(canvas, {
        showGrid: c.grid,
        showNumbers: c.nums,
        points,
        edges,
        reflectionAxis,
        translation,
        translationFrom,
        translationTo,
      })
    },
    []
  )

  const loadNextQuestion = useCallback(
    (mode: Mode, qIdx: number, _s: number, _c: number, _w: number) => {
      const cfg = MODE_CFG[mode]
      if (qIdx >= cfg.questions) {
        const mi = MODES.indexOf(mode)
        if (mi < MODES.length - 1) {
          setCurrentMode(MODES[mi + 1])
          modeRef.current = MODES[mi + 1]
          setModeQIdx(0)
          qIdxRef.current = 0
          setPhase("transition")
        } else {
          stopCountdown()
          stopFinalClock()
          let finalSec = 0
          if (finalStartRef.current > 0) {
            finalSec = Math.round(
              (Date.now() - finalStartRef.current) / 1000
            )
            const bonus = Math.max(0, 300 - finalSec)
            scoreRef.current += bonus
            setScore(scoreRef.current)
            setFinalElapsed(finalSec)
          }
          setPhase("results")
        }
        return
      }

      setSelectedIdx(null)
      setAnswerState("idle")
      answerRef.current = "idle"

      let newQ: Question
      if (mode === "final") newQ = genFinalQ(qIdx)
      else if (mode === "hell") newQ = genHellQ(qIdx, cfg.choices)
      else newQ = genIdentifyQ(cfg.choices, false)

      setQuestion(newQ)
      setModeQIdx(qIdx)
      setTimeLeft(cfg.time)
      setMaxTime(cfg.time)

      requestAnimationFrame(() => {
        setupCanvas()
        renderQ(newQ, mode)
      })

      stopCountdown()
      if (cfg.time > 0) {
        let tl = cfg.time
        setTimeLeft(tl)
        timerRef.current = window.setInterval(() => {
          tl--
          setTimeLeft(tl)
          if (tl <= 0) {
            stopCountdown()
            if (answerRef.current === "idle") {
              answerRef.current = "timeout"
              setAnswerState("timeout")
              wrongRef.current++
              setWrongCount(wrongRef.current)
              setTimeout(
                () =>
                  loadNextQuestion(
                    modeRef.current,
                    qIdxRef.current + 1,
                    scoreRef.current,
                    correctRef.current,
                    wrongRef.current
                  ),
                1400
              )
            }
          }
        }, 1000)
      } else if (mode === "final" && qIdx === 0) {
        finalStartRef.current = Date.now()
        finalClockRef.current = window.setInterval(() => {
          const el = Math.round(
            (Date.now() - finalStartRef.current) / 1000
          )
          setFinalElapsed(el)
        }, 1000)
      }
    },
    [setupCanvas, renderQ, stopCountdown, stopFinalClock]
  )

  const startGame = useCallback(() => {
    scoreRef.current = 0
    correctRef.current = 0
    wrongRef.current = 0
    modeRef.current = "simple"
    qIdxRef.current = 0
    finalStartRef.current = 0
    setScore(0)
    setCorrectCount(0)
    setWrongCount(0)
    setCurrentMode("simple")
    setModeQIdx(0)
    setFinalElapsed(0)
    setPhase("playing")
    loadNextQuestion("simple", 0, 0, 0, 0)
  }, [loadNextQuestion])

  const pickAnswer = useCallback(
    (idx: number) => {
      if (answerRef.current !== "idle" || !question) return
      stopCountdown()
      setSelectedIdx(idx)

      if (idx === question.correctIdx) {
        answerRef.current = "correct"
        setAnswerState("correct")
        correctRef.current++
        scoreRef.current += POINTS_PER_MODE[modeRef.current]
        setCorrectCount(correctRef.current)
        setScore(scoreRef.current)
      } else {
        answerRef.current = "wrong"
        setAnswerState("wrong")
        wrongRef.current++
        setWrongCount(wrongRef.current)
      }

      setTimeout(
        () =>
          loadNextQuestion(
            modeRef.current,
            qIdxRef.current + 1,
            scoreRef.current,
            correctRef.current,
            wrongRef.current
          ),
        1400
      )
    },
    [question, stopCountdown, loadNextQuestion]
  )

  const continueFromTransition = useCallback(() => {
    setPhase("playing")
    loadNextQuestion(
      modeRef.current,
      0,
      scoreRef.current,
      correctRef.current,
      wrongRef.current
    )
  }, [loadNextQuestion])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (
        phase === "playing" &&
        answerRef.current === "idle" &&
        question
      ) {
        const num = parseInt(e.key, 10)
        if (num >= 1 && num <= question.choices.length) pickAnswer(num - 1)
      }
      if (phase === "transition" && (e.key === "Enter" || e.key === " "))
        continueFromTransition()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [phase, question, pickAnswer, continueFromTransition])

  useEffect(() => {
    const handleResize = () => {
      if (phase === "playing" && question) {
        setupCanvas()
        renderQ(question, currentMode)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [phase, question, currentMode, setupCanvas, renderQ])

  const total = correctCount + wrongCount
  const cfg = MODE_CFG[currentMode]
  const tipsForMode =
    currentMode === "final"
      ? question
        ? question.type === "area"
          ? [
              "Calculate area using the coordinate formula.",
              "Rectangle area: width × height from coordinate differences.",
              "Triangle area: ½ × base × height.",
            ]
          : question.type === "reflection"
            ? [
                "Reflection across x-axis: (x, y) → (x, −y)",
                "Reflection across y-axis: (x, y) → (−x, y)",
                "Reflection about origin: (x, y) → (−x, −y)",
              ]
            : question.type === "translation"
              ? [
                  "Translation adds to both coordinates.",
                  "Move right (+dx) or left (−dx) for x.",
                  "Move up (+dy) or down (−dy) for y.",
                ]
              : TIPS.hell
        : TIPS.simple
      : currentMode === "hell"
        ? TIPS.hell
        : TIPS[currentMode]

  return (
    <div className="mx-auto max-w-[860px]">
      {/* START */}
      {phase === "start" && (
        <div className="flex flex-col items-center gap-5 py-10 text-center">
          <div className="text-5xl">📐</div>
          <h1 className="font-heading text-3xl font-bold">
            Coordinate Challenge
          </h1>
          <p className="max-w-[540px] text-sm leading-relaxed text-muted-foreground">
            Test your coordinate geometry skills across 4 progressive levels.
            Identify points, use reference clues, calculate areas, and master
            reflections &amp; translations!
          </p>
          <div className="grid w-full max-w-[540px] grid-cols-2 gap-3">
            {(
              [
                {
                  mode: "simple" as Mode,
                  color: "text-blue-400",
                  desc: "Grid + Labels · 20s · 3 choices",
                },
                {
                  mode: "challenge" as Mode,
                  color: "text-amber-400",
                  desc: "No Grid · 10s · 5 choices",
                },
                {
                  mode: "hell" as Mode,
                  color: "text-red-400",
                  desc: "No Grid/Labels · Identify + Reflect + Translate",
                },
                {
                  mode: "final" as Mode,
                  color: "text-purple-400",
                  desc: "Area + Identify + Reflect + Translate",
                },
              ] as const
            ).map((m) => (
              <div
                key={m.mode}
                className="flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/30 p-3 text-center"
              >
                <strong className={cn("text-sm", m.color)}>
                  {MODE_LABELS[m.mode]}
                </strong>
                <span className="text-xs text-muted-foreground">{m.desc}</span>
              </div>
            ))}
          </div>
          <Button onClick={startGame}>Start Game</Button>
        </div>
      )}

      {/* PLAYING */}
      {phase === "playing" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_220px]">
            {/* Canvas */}
            <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20">
              <canvas
                ref={canvasRef}
                className="block aspect-square w-full max-h-[440px] min-h-[220px] min-w-[220px]"
              />
            </div>

            {/* Tips */}
            <div className="hidden flex-col gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 lg:flex lg:min-w-[200px] lg:max-w-[280px]">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <span className="text-lg">💡</span>
                <strong className="text-xs font-semibold uppercase tracking-wider">
                  Tips
                </strong>
              </div>
              <div className="flex flex-col gap-2">
                {tipsForMode.map((t, i) => (
                  <p key={i} className="text-xs leading-relaxed text-muted-foreground">
                    {t}
                  </p>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col gap-3">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <span
                  className={cn(
                    "mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider",
                    currentMode === "simple" &&
                      "bg-blue-500/15 text-blue-400",
                    currentMode === "challenge" &&
                      "bg-amber-500/15 text-amber-400",
                    currentMode === "hell" &&
                      "bg-red-500/15 text-red-400",
                    currentMode === "final" &&
                      "bg-purple-500/15 text-purple-400"
                  )}
                >
                  {MODE_LABELS[currentMode]}
                </span>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between rounded-md bg-background/50 px-2.5 py-1.5">
                    <small className="text-xs text-muted-foreground">
                      Question
                    </small>
                    <strong className="text-sm">
                      {modeQIdx + 1} / {cfg.questions}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-background/50 px-2.5 py-1.5">
                    <small className="text-xs text-muted-foreground">
                      Score
                    </small>
                    <strong className="text-sm text-blue-400">{score}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-background/50 px-2.5 py-1.5">
                    <small className="text-xs text-muted-foreground">
                      Correct
                    </small>
                    <strong className="text-sm text-green-500">
                      {correctCount}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-background/50 px-2.5 py-1.5">
                    <small className="text-xs text-muted-foreground">
                      Wrong
                    </small>
                    <strong className="text-sm text-red-500">
                      {wrongCount}
                    </strong>
                  </div>
                </div>

                {/* Timer */}
                {cfg.time > 0 && (
                  <div className="mt-3 rounded-md bg-background/50 p-2.5">
                    <div className="flex items-center justify-between">
                      <small className="text-xs text-muted-foreground">
                        Time
                      </small>
                      <strong
                        className={cn(
                          "text-lg font-bold",
                          timeLeft <= 3
                            ? "text-red-500 animate-pulse"
                            : timeLeft <= 5
                              ? "text-amber-500"
                              : "text-green-500"
                        )}
                      >
                        {timeLeft}s
                      </strong>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-background">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-1000 linear",
                          timeLeft <= 3
                            ? "bg-red-500"
                            : timeLeft <= 5
                              ? "bg-amber-500"
                              : "bg-green-500"
                        )}
                        style={{
                          width: `${maxTime > 0 ? (timeLeft / maxTime) * 100 : 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Final elapsed */}
                {currentMode === "final" && (
                  <div className="mt-3 flex items-center justify-between rounded-md bg-background/50 px-2.5 py-1.5">
                    <small className="text-xs text-muted-foreground">
                      Elapsed
                    </small>
                    <strong className="text-sm">{finalElapsed}s</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Prompt */}
          <p className="py-2 text-center text-base font-semibold">
            {question?.prompt}
          </p>

          {/* Hint for hell/final */}
          {(currentMode === "hell" ||
            (currentMode === "final" && question?.type !== "area")) && (
            <p className="text-center text-xs italic text-muted-foreground">
              Use the reference points A and B to deduce P's coordinates.
            </p>
          )}

          {/* Choices */}
          <div className="flex flex-wrap justify-center gap-2">
            {question?.choices.map((c, i) => (
              <button
                key={i}
                disabled={answerState !== "idle"}
                onClick={() => pickAnswer(i)}
                className={cn(
                  "inline-flex min-w-[110px] items-center gap-2 rounded-lg border px-4 py-2.5 font-mono text-sm transition-all",
                  answerState === "idle" &&
                    "border-border bg-muted/30 hover:border-primary hover:bg-muted/50 hover:-translate-y-0.5",
                  answerState === "correct" &&
                    i === question.correctIdx &&
                    "border-green-500 bg-green-500/20 text-green-400",
                  answerState === "wrong" &&
                    i === question.correctIdx &&
                    "border-green-500 bg-green-500/20 text-green-400",
                  answerState === "wrong" &&
                    i === selectedIdx &&
                    i !== question.correctIdx &&
                    "border-red-500 bg-red-500/20 text-red-400",
                  answerState === "timeout" &&
                    i === question.correctIdx &&
                    "border-amber-500 bg-amber-500/20 text-amber-400",
                  answerState !== "idle" && "cursor-default opacity-60"
                )}
              >
                <span className="flex size-5 items-center justify-center rounded bg-muted text-[10px] font-semibold text-muted-foreground">
                  {i + 1}
                </span>
                {c}
              </button>
            ))}
          </div>

          {/* Feedback */}
          {answerState !== "idle" && (
            <div
              className={cn(
                "rounded-lg px-4 py-2 text-center text-sm font-medium",
                answerState === "correct" &&
                  "bg-green-500/15 text-green-400",
                answerState === "wrong" &&
                  "bg-red-500/15 text-red-400",
                answerState === "timeout" &&
                  "bg-amber-500/15 text-amber-400"
              )}
            >
              {answerState === "correct"
                ? `✓ Correct! +${POINTS_PER_MODE[currentMode]} pts`
                : `✗ ${answerState === "timeout" ? "Time's up!" : "Wrong!"} The answer was ${question?.choices[question?.correctIdx]}`}
            </div>
          )}
        </div>
      )}

      {/* TRANSITION */}
      {phase === "transition" && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="text-5xl">🚀</div>
          <h2 className="font-heading text-2xl font-bold">
            {TRANSITION_MSG[modeRef.current]?.title || "Get Ready!"}
          </h2>
          <p className="max-w-[400px] text-sm text-muted-foreground">
            {TRANSITION_MSG[modeRef.current]?.sub ||
              "Next challenge incoming!"}
          </p>
          <Button onClick={continueFromTransition}>Continue</Button>
          <span className="text-xs text-muted-foreground">
            or press Enter / Space
          </span>
        </div>
      )}

      {/* RESULTS */}
      {phase === "results" && (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="text-5xl">🏆</div>
          <h2 className="font-heading text-2xl font-bold">Game Complete!</h2>
          <div className="grid w-full max-w-[400px] grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <small className="text-xs text-muted-foreground">
                Final Score
              </small>
              <p className="text-2xl font-bold text-blue-400">{score}</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <small className="text-xs text-muted-foreground">Correct</small>
              <p className="text-2xl font-bold text-green-500">
                {correctCount}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <small className="text-xs text-muted-foreground">Wrong</small>
              <p className="text-2xl font-bold text-red-500">{wrongCount}</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <small className="text-xs text-muted-foreground">Accuracy</small>
              <p className="text-2xl font-bold">
                {total > 0
                  ? `${Math.round((correctCount / total) * 100)}%`
                  : "0%"}
              </p>
            </div>
            {finalElapsed > 0 && (
              <>
                <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                  <small className="text-xs text-muted-foreground">
                    Final Challenge Time
                  </small>
                  <p className="text-2xl font-bold">{finalElapsed}s</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                  <small className="text-xs text-muted-foreground">
                    Time Bonus
                  </small>
                  <p className="text-2xl font-bold text-blue-400">
                    +{Math.max(0, 300 - finalElapsed)}
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="flex gap-3">
            <Button onClick={startGame}>Play Again</Button>
            <Button
              variant="outline"
              onClick={() => {
                stopCountdown()
                stopFinalClock()
                setPhase("start")
              }}
            >
              Back to Start
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
