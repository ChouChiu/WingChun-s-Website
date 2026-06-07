"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/utils"
import { CalculatorWidget } from "../components/calculator"

const STORAGE_KEY = "percentGameData_v3"
const TARGET_SCORE = 150
const POINTS_CORRECT = 10
const POINTS_WRONG = 10

interface Problem {
  old: number
  new: number
  percent: number
  isIncrease: boolean
  type: number
  answer: number
  display: { old: string; mid: string; new: string; mode: string }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  weight: string,
  maxWidth: number,
  maxSize: number,
  minSize: number
) {
  let size = Math.floor(maxSize)
  while (size >= minSize) {
    ctx.font = `${weight} ${size}px system-ui`
    if (ctx.measureText(text).width <= maxWidth) return size
    size--
  }
  return minSize
}

function renderTextFit(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  weight: string,
  maxSize: number,
  minSize: number
) {
  ctx.save()
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  const fitSize = fitFontSize(ctx, text, weight, maxWidth, maxSize, minSize)
  ctx.font = `${weight} ${fitSize}px system-ui`
  if (ctx.measureText(text).width <= maxWidth) {
    ctx.fillText(text, x, y)
    ctx.restore()
    return
  }
  ctx.font = `${weight} ${fitSize}px system-ui`
  ctx.fillText(text, x, y)
  ctx.restore()
}

function drawBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  colors: {
    boxBg: string
    strokeColor: string
    textPrimary: string
    textSecondary: string
    accent: string
  }
) {
  const left = x - w / 2
  const top = y - h / 2
  ctx.save()
  roundRect(ctx, left, top, w, h, 10)
  ctx.fillStyle = colors.boxBg
  ctx.fill()
  ctx.lineWidth = 1.5
  ctx.strokeStyle = colors.strokeColor
  ctx.stroke()
  ctx.font = `600 ${Math.max(12, Math.round(w / 6))}px system-ui`
  ctx.fillStyle = colors.textSecondary
  ctx.textAlign = "center"
  ctx.textBaseline = "bottom"
  ctx.fillText(label, x, top - 8)
  ctx.font = `700 ${Math.max(18, Math.round(w / 3))}px system-ui`
  ctx.fillStyle = value === "?" ? colors.accent : colors.textPrimary
  ctx.textBaseline = "middle"
  ctx.fillText(value, x, y)
  ctx.restore()
}

function drawMidBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  colors: {
    boxBg: string
    strokeColor: string
    textPrimary: string
    textSecondary: string
    accent: string
  }
) {
  const left = x - w / 2
  const top = y - h / 2
  ctx.save()
  roundRect(ctx, left, top, w, h, 10)
  ctx.fillStyle = colors.boxBg
  ctx.fill()
  ctx.lineWidth = 1.5
  ctx.strokeStyle = colors.strokeColor
  ctx.stroke()
  ctx.font = `600 ${Math.max(12, Math.round(w / 8))}px system-ui`
  ctx.fillStyle = colors.textSecondary
  ctx.textAlign = "center"
  ctx.textBaseline = "bottom"
  ctx.fillText(label, x, top - 8)
  ctx.fillStyle = value.includes("?") ? colors.accent : colors.textPrimary
  ctx.textBaseline = "middle"
  const maxFontSize = Math.max(16, Math.round(w / 5))
  renderTextFit(ctx, value, x, y, Math.max(10, w - 12), "700", maxFontSize, 10)
  ctx.restore()
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  colors: { strokeColor: string }
) {
  const headLength = 10
  const angle = Math.atan2(y2 - y1, x2 - x1)
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.strokeStyle = colors.strokeColor
  ctx.lineWidth = 2
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(
    x2 - headLength * Math.cos(angle - Math.PI / 6),
    y2 - headLength * Math.sin(angle - Math.PI / 6)
  )
  ctx.moveTo(x2, y2)
  ctx.lineTo(
    x2 - headLength * Math.cos(angle + Math.PI / 6),
    y2 - headLength * Math.sin(angle + Math.PI / 6)
  )
  ctx.closePath()
  ctx.fillStyle = colors.strokeColor
  ctx.fill()
  ctx.restore()
}

function drawProblem(canvas: HTMLCanvasElement, p: Problem) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  const boxBg = "#2f2f2f"
  const textPrimary = "#ffffff"
  const textSecondary = "#a1a1a1"
  const strokeColor = "#333333"
  const accent = "#479ef5"

  const dW = canvas.clientWidth
  const dH = canvas.clientHeight

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = "#1b1b1b"
  ctx.fillRect(0, 0, dW, dH)

  const centerY = dH / 2 + 15
  const boxW = dW <= 375 ? 60 : dW <= 768 ? 70 : 100
  const midBoxW = dW <= 375 ? 90 : dW <= 768 ? 110 : 140
  const arrowLen = dW <= 375 ? 20 : dW <= 768 ? 30 : 50
  const boxH = 60
  const centerX = dW / 2
  const midX = centerX
  const oldX = centerX - midBoxW / 2 - arrowLen - boxW / 2 - 15
  const newX = centerX + midBoxW / 2 + arrowLen + boxW / 2 + 15

  const colors = { boxBg, strokeColor, textPrimary, textSecondary, accent }

  drawBox(ctx, oldX, centerY, boxW, boxH, "Old", p.display.old, colors)
  drawBox(ctx, newX, centerY, boxW, boxH, "New", p.display.new, colors)
  drawMidBox(
    ctx,
    midX,
    centerY,
    midBoxW,
    boxH,
    "% Change",
    p.display.mid,
    colors
  )
  drawArrow(
    ctx,
    oldX + boxW / 2 + 5,
    centerY,
    midX - midBoxW / 2 - 5,
    centerY,
    colors
  )
  drawArrow(
    ctx,
    midX + midBoxW / 2 + 5,
    centerY,
    newX - boxW / 2 - 5,
    centerY,
    colors
  )
}

function generateQuestion(): Problem {
  const type = Math.floor(Math.random() * 3)
  const oldVal = (Math.floor(Math.random() * 10) + 2) * 10
  const percent = (Math.floor(Math.random() * 5) + 1) * 10
  const isIncrease = Math.random() > 0.5
  const factor = isIncrease ? 1 + percent / 100 : 1 - percent / 100
  const newVal = Math.round(oldVal * factor)
  const sign = isIncrease ? "+" : "-"
  const factorText = `( 1 ${sign} ${percent}% )`

  const problem: Problem = {
    old: 0,
    new: 0,
    percent,
    isIncrease,
    type,
    answer: 0,
    display: { old: "", mid: "", new: "", mode: "" },
  }

  if (type === 0) {
    problem.answer = newVal
    problem.display = {
      old: String(oldVal),
      mid: factorText,
      new: "?",
      mode: "findNew",
    }
  } else if (type === 1) {
    problem.answer = oldVal
    problem.display = {
      old: "?",
      mid: factorText,
      new: String(newVal),
      mode: "findOld",
    }
  } else {
    problem.answer = isIncrease ? percent : -percent
    problem.display = {
      old: String(oldVal),
      mid: "( 1 + ? % )",
      new: String(newVal),
      mode: "findPercent",
    }
  }

  return problem
}

function loadState(): {
  score: number
  correctCount: number
  wrongCount: number
  hasCelebrated: boolean
  currProblem: Problem | null
} | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveState(state: {
  score: number
  correctCount: number
  wrongCount: number
  hasCelebrated: boolean
  currProblem: Problem | null
}) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function PercentageGamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [score, setScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [, setCurrProblem] = useState<Problem | null>(null)
  const [feedback, setFeedback] = useState("")
  const [showReport, setShowReport] = useState(false)
  const [showEasterAnswer, setShowEasterAnswer] = useState(false)

  const scoreRef = useRef(0)
  const correctRef = useRef(0)
  const wrongRef = useRef(0)
  const problemRef = useRef<Problem | null>(null)
  const easterProgress = useRef(0)
  const easterTimer = useRef<number | null>(null)
  const feedbackTimer = useRef<number | null>(null)
  const resetClicks = useRef(0)

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = Math.max(1, Math.floor(rect.width * dpr))
    canvas.height = Math.max(1, Math.floor(rect.height * dpr))
    const ctx = canvas.getContext("2d")
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }, [])

  const drawCurr = useCallback(
    (p: Problem) => {
      const canvas = canvasRef.current
      if (!canvas) return
      setupCanvas()
      drawProblem(canvas, p)
    },
    [setupCanvas]
  )

  const genAndDraw = useCallback(() => {
    const p = generateQuestion()
    problemRef.current = p
    setCurrProblem(p)
    setFeedback("")
    requestAnimationFrame(() => drawCurr(p))
    if (inputRef.current) {
      inputRef.current.value = ""
      inputRef.current.focus()
    }
    saveState({
      score: scoreRef.current,
      correctCount: correctRef.current,
      wrongCount: wrongRef.current,
      hasCelebrated: false,
      currProblem: p,
    })
  }, [drawCurr])

  useEffect(() => {
    const saved = loadState()
    if (saved) {
      scoreRef.current = saved.score || 0
      correctRef.current = saved.correctCount || 0
      wrongRef.current = saved.wrongCount || 0
      setScore(scoreRef.current)
      setCorrectCount(correctRef.current)
      setWrongCount(wrongRef.current)
      if (saved.currProblem) {
        problemRef.current = saved.currProblem
        setCurrProblem(saved.currProblem)
        requestAnimationFrame(() => {
          if (saved.currProblem) drawCurr(saved.currProblem)
        })
      } else {
        genAndDraw()
      }
    } else {
      genAndDraw()
    }

    const handleResize = () => {
      if (problemRef.current) drawCurr(problemRef.current)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [drawCurr, genAndDraw])

  const checkAnswer = useCallback(() => {
    if (!problemRef.current) return
    const val = inputRef.current?.value
    const userAnswer = parseFloat(val || "")
    if (isNaN(userAnswer)) {
      setFeedback("Please enter a number")
      return
    }
    const p = problemRef.current
    if (Math.abs(userAnswer - p.answer) < 0.01) {
      scoreRef.current += POINTS_CORRECT
      correctRef.current++
      setFeedback("Correct! +10 pts")
    } else {
      scoreRef.current -= POINTS_WRONG
      wrongRef.current++
      setFeedback(`Wrong! Correct answer: ${p.answer}`)
    }
    setScore(scoreRef.current)
    setCorrectCount(correctRef.current)
    setWrongCount(wrongRef.current)
    saveState({
      score: scoreRef.current,
      correctCount: correctRef.current,
      wrongCount: wrongRef.current,
      hasCelebrated: false,
      currProblem: p,
    })
    if (p) drawCurr(p)
    setTimeout(genAndDraw, 1000)
  }, [drawCurr, genAndDraw])

  const showAnswerTemp = useCallback(() => {
    if (!problemRef.current) return
    setFeedback(`Correct answer: ${problemRef.current.answer}`)
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
    feedbackTimer.current = window.setTimeout(() => {
      setFeedback("")
      feedbackTimer.current = null
    }, 3000)
  }, [])

  const handleReset = useCallback(() => {
    resetClicks.current++
    if (resetClicks.current === 1) {
      setFeedback("Click again to confirm reset")
      setTimeout(() => {
        resetClicks.current = 0
      }, 3000)
    } else if (resetClicks.current >= 2) {
      localStorage.removeItem(STORAGE_KEY)
      scoreRef.current = 0
      correctRef.current = 0
      wrongRef.current = 0
      problemRef.current = null
      setScore(0)
      setCorrectCount(0)
      setWrongCount(0)
      setFeedback("Progress reset!")
      resetClicks.current = 0
      setTimeout(genAndDraw, 500)
    }
  }, [genAndDraw])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !showReport) checkAnswer()

      // Easter egg: type "key"
      const seq = ["k", "e", "y"]
      const key = (e.key || "").toLowerCase()
      if (key === seq[easterProgress.current]) {
        easterProgress.current++
        if (easterTimer.current) clearTimeout(easterTimer.current)
        easterTimer.current = window.setTimeout(() => {
          easterProgress.current = 0
          easterTimer.current = null
        }, 2000)
        if (easterProgress.current >= seq.length) {
          setShowEasterAnswer(true)
          setFeedback("Easter egg unlocked: Show Answer revealed!")
          easterProgress.current = 0
          if (easterTimer.current) {
            clearTimeout(easterTimer.current)
            easterTimer.current = null
          }
        }
      } else {
        easterProgress.current = key === seq[0] ? 1 : 0
        if (easterTimer.current) {
          clearTimeout(easterTimer.current)
          easterTimer.current = null
        }
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [checkAnswer, showReport])

  const pct = Math.max(0, Math.min(100, (score / TARGET_SCORE) * 100))
  const total = correctCount + wrongCount

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="stagger-1 mb-3 animate-fade-in-up"
      >
        <Link href="/math-game">
          <ArrowLeft className="mr-1.5 size-4" />
          Back to Math Games
        </Link>
      </Button>

      <h1 className="stagger-2 mb-4 animate-fade-in-up font-bold font-heading text-2xl">
        Percent Change Practice
      </h1>

      {/* Status Bar */}
      <div className="stagger-3 mb-4 flex animate-fade-in-up flex-wrap items-center gap-2">
        <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5 font-semibold text-sm">
          Target: {TARGET_SCORE}
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5 text-sm">
          Score: <span className="font-bold text-blue-400">{score}</span>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5 text-sm">
          Correct: {correctCount}
        </div>
      </div>

      {/* Progress */}
      <div className="stagger-4 mb-5 h-1.5 animate-fade-in-up overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Canvas Area */}
      <div className="stagger-5 mb-5 flex animate-fade-in-up flex-col items-center gap-4 rounded-xl border border-border/60 bg-muted/20 p-6">
        <canvas
          ref={canvasRef}
          className="max-w-full rounded-md"
          style={{ width: "100%", height: 250 }}
        />

        <div className="flex flex-wrap items-center justify-center gap-2">
          <label className="font-semibold text-sm">Answer:</label>
          <input
            ref={inputRef}
            type="number"
            className="w-36 rounded-md border-border border-b-2 bg-background px-3 py-1.5 text-center font-semibold text-lg outline-none focus:border-primary"
            aria-label="Answer"
          />
          <Button onClick={checkAnswer}>Submit</Button>
          {showEasterAnswer && (
            <Button variant="outline" onClick={showAnswerTemp}>
              Show Answer
            </Button>
          )}
        </div>

        {feedback && (
          <p
            className={cn(
              "min-h-[24px] rounded-md px-3 py-1 text-center font-medium text-sm",
              feedback.includes("Correct") && "bg-green-500/15 text-green-400",
              feedback.includes("Wrong") && "bg-red-500/15 text-red-400",
              feedback.includes("reset") && "bg-amber-500/15 text-amber-400",
              !feedback.includes("Correct") &&
                !feedback.includes("Wrong") &&
                !feedback.includes("reset") &&
                "text-muted-foreground"
            )}
          >
            {feedback}
          </p>
        )}
      </div>

      {/* Buttons */}
      <div
        className="flex animate-fade-in-up flex-wrap justify-center gap-3"
        style={{ animationDelay: "400ms" }}
      >
        <Button onClick={() => setShowReport(true)}>📊 Report</Button>
        <Button variant="outline" onClick={handleReset}>
          ⚠️ Reset All Progress
        </Button>
      </div>

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border/60 bg-card p-6 shadow-xl">
            <h2 className="mb-4 font-bold text-lg">Report</h2>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/30 p-3 text-center">
                <small className="text-muted-foreground text-xs">
                  Final Score
                </small>
                <p className="font-bold text-blue-400 text-xl">{score}</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-3 text-center">
                <small className="text-muted-foreground text-xs">
                  Total Questions
                </small>
                <p className="font-bold text-xl">{total}</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-3 text-center">
                <small className="text-muted-foreground text-xs">
                  Correct Answers
                </small>
                <p className="font-bold text-green-500 text-xl">
                  {correctCount}
                </p>
              </div>
              <div className="rounded-lg bg-muted/30 p-3 text-center">
                <small className="text-muted-foreground text-xs">
                  Accuracy
                </small>
                <p className="font-bold text-xl">
                  {total > 0
                    ? `${Math.round((correctCount / total) * 100)}%`
                    : "0%"}
                </p>
              </div>
            </div>
            <p className="mb-4 text-center text-muted-foreground text-xs">
              {new Date().toLocaleString()}
            </p>
            <div className="flex justify-center">
              <Button onClick={() => setShowReport(false)}>
                Continue Practice
              </Button>
            </div>
          </div>
        </div>
      )}

      <CalculatorWidget />
    </div>
  )
}
