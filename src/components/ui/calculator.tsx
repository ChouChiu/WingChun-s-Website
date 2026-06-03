import { useState, useCallback, useEffect } from "react"
import { Calculator as CalcIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function CalculatorWidget() {
  const [open, setOpen] = useState(false)
  const [display, setDisplay] = useState("0")
  const [prev, setPrev] = useState<number | null>(null)
  const [op, setOp] = useState<string | null>(null)
  const [waiting, setWaiting] = useState(false)

  const inputDigit = useCallback(
    (d: string) => {
      if (waiting) {
        setDisplay(d)
        setWaiting(false)
      } else {
        setDisplay(display === "0" ? d : display + d)
      }
    },
    [display, waiting]
  )

  const inputDot = useCallback(() => {
    if (waiting) {
      setDisplay("0.")
      setWaiting(false)
      return
    }
    if (!display.includes(".")) setDisplay(display + ".")
  }, [display, waiting])

  const clearAll = useCallback(() => {
    setDisplay("0")
    setPrev(null)
    setOp(null)
    setWaiting(false)
  }, [])

  const backspace = useCallback(() => {
    setDisplay(display.length > 1 ? display.slice(0, -1) : "0")
  }, [display])

  const toggleSign = useCallback(() => {
    const val = parseFloat(display)
    setDisplay(String(-val))
  }, [display])

  const calculate = useCallback(
    (a: number, b: number, operator: string): number => {
      switch (operator) {
        case "+":
          return a + b
        case "-":
          return a - b
        case "×":
          return a * b
        case "÷":
          return b !== 0 ? a / b : NaN
        default:
          return b
      }
    },
    []
  )

  const handleOp = useCallback(
    (nextOp: string) => {
      const current = parseFloat(display)
      if (prev !== null && op && !waiting) {
        const result = calculate(prev, current, op)
        const displayVal = isNaN(result) ? "Error" : String(parseFloat(result.toFixed(10)))
        setDisplay(displayVal)
        setPrev(isNaN(result) ? null : result)
      } else {
        setPrev(current)
      }
      setOp(nextOp)
      setWaiting(true)
    },
    [display, prev, op, waiting, calculate]
  )

  const handleEquals = useCallback(() => {
    if (prev === null || !op) return
    const current = parseFloat(display)
    const result = calculate(prev, current, op)
    const displayVal = isNaN(result) ? "Error" : String(parseFloat(result.toFixed(10)))
    setDisplay(displayVal)
    setPrev(null)
    setOp(null)
    setWaiting(true)
  }, [display, prev, op, calculate])

  const handlePercent = useCallback(() => {
    const val = parseFloat(display)
    setDisplay(String(val / 100))
  }, [display])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") inputDigit(e.key)
      else if (e.key === ".") inputDot()
      else if (e.key === "+") handleOp("+")
      else if (e.key === "-") handleOp("-")
      else if (e.key === "*") handleOp("×")
      else if (e.key === "/") {
        e.preventDefault()
        handleOp("÷")
      }
      else if (e.key === "%" || e.key === "5") handlePercent()
      else if (e.key === "Enter" || e.key === "=") handleEquals()
      else if (e.key === "Backspace") backspace()
      else if (e.key === "Escape") clearAll()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, inputDigit, inputDot, handleOp, handleEquals, handlePercent, backspace, clearAll])

  const btn = (label: string, onClick: () => void, variant?: string) => (
    <button
      onClick={onClick}
      className={cn(
        "flex h-11 items-center justify-center rounded-lg text-sm font-semibold transition-colors",
        variant === "op"
          ? "bg-primary/20 text-primary hover:bg-primary/30"
          : variant === "fn"
            ? "bg-muted text-muted-foreground hover:bg-muted/80"
            : "bg-background/50 hover:bg-background/80"
      )}
    >
      {label}
    </button>
  )

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-6 right-6 z-50 size-12 rounded-full shadow-lg"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="size-5" /> : <CalcIcon className="size-5" />}
      </Button>

      <div
        data-state={open ? "open" : "closed"}
        className="calc-panel fixed bottom-20 right-6 z-50 w-64 rounded-xl border border-border/60 bg-card/95 p-3 shadow-xl backdrop-blur-xl"
      >
        <div className="mb-2 rounded-lg bg-muted/50 px-3 py-2 text-right">
          <div className="truncate text-2xl font-bold tabular-nums">
            {display}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {btn("C", clearAll, "fn")}
          {btn("±", toggleSign, "fn")}
          {btn("%", handlePercent, "fn")}
          {btn("÷", () => handleOp("÷"), "op")}

          {btn("7", () => inputDigit("7"))}
          {btn("8", () => inputDigit("8"))}
          {btn("9", () => inputDigit("9"))}
          {btn("×", () => handleOp("×"), "op")}

          {btn("4", () => inputDigit("4"))}
          {btn("5", () => inputDigit("5"))}
          {btn("6", () => inputDigit("6"))}
          {btn("-", () => handleOp("-"), "op")}

          {btn("1", () => inputDigit("1"))}
          {btn("2", () => inputDigit("2"))}
          {btn("3", () => inputDigit("3"))}
          {btn("+", () => handleOp("+"), "op")}

          {btn("⌫", backspace, "fn")}
          {btn("0", () => inputDigit("0"))}
          {btn(".", inputDot)}
          {btn("=", handleEquals, "op")}
        </div>
      </div>
    </>
  )
}
