import { Calculator as CalcIcon, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/utils"

function formatNum(raw: string): string {
  if (raw === "Error") return raw
  const num = Number(raw)
  if (Number.isNaN(num)) return raw
  const abs = Math.abs(num)
  if (abs !== 0 && (abs >= 1e12 || abs < 1e-6)) return num.toExponential(6)
  const [intPart, decPart] = raw.split(".")
  const sign = intPart.startsWith("-") ? "-" : ""
  const digits = intPart.replace("-", "")
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return sign + grouped + (decPart !== undefined ? `.${decPart}` : "")
}

function formatExpr(expr: string): string {
  return expr
    .replace(/\*/g, "×")
    .replace(/\//g, "÷")
    .replace(/(^|[^a-z0-9_.)])(\d+\.\d+)/gi, (_, pre, num) => {
      const [i, d] = num.split(".")
      return pre + i.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + d
    })
    .replace(/(^|[^a-z0-9_.),])(\d{4,})/g, (_, pre, num) => {
      return pre + num.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    })
}

function tokenize(expr: string): (number | string)[] {
  const tokens: (number | string)[] = []
  let i = 0
  while (i < expr.length) {
    const ch = expr[i]
    if (ch === " ") {
      i++
      continue
    }
    if (
      (ch >= "0" && ch <= "9") ||
      ch === "." ||
      (ch === "-" &&
        (i === 0 ||
          typeof tokens[tokens.length - 1] === "string" ||
          tokens[tokens.length - 1] === "("))
    ) {
      let num = ""
      if (ch === "-") {
        num = "-"
        i++
      }
      let hasDot = num === "-"
      while (
        i < expr.length &&
        ((expr[i] >= "0" && expr[i] <= "9") || expr[i] === ".")
      ) {
        if (expr[i] === ".") {
          if (hasDot) break
          hasDot = true
        }
        num += expr[i]
        i++
      }
      tokens.push(Number(num))
    } else if (ch === "(" || ch === ")") {
      tokens.push(ch)
      i++
    } else if ("+-*/%".includes(ch)) {
      tokens.push(ch)
      i++
    } else if (expr.startsWith("sqrt", i)) {
      tokens.push("sqrt")
      i += 4
    } else {
      i++
    }
  }
  return tokens
}

function evalTokens(tokens: (number | string)[]): number {
  const output: (number | string)[] = []
  const ops: string[] = []
  const prec: Record<string, number> = {
    "+": 1,
    "-": 1,
    "*": 2,
    "/": 2,
    "%": 2,
  }

  for (const t of tokens) {
    if (typeof t === "number") {
      output.push(t)
    } else if (t === "sqrt") {
      ops.push(t)
    } else if (t === "(") {
      ops.push(t)
    } else if (t === ")") {
      while (ops.length && ops[ops.length - 1] !== "(") {
        output.push(ops.pop()!)
      }
      if (ops.length) ops.pop()
      if (ops.length && ops[ops.length - 1] === "sqrt") {
        output.push(ops.pop()!)
      }
    } else if (prec[t]) {
      while (
        ops.length &&
        ops[ops.length - 1] !== "(" &&
        ops[ops.length - 1] !== "sqrt" &&
        (ops[ops.length - 1] === "sqrt" ||
          (prec[ops[ops.length - 1]] ?? 0) >= prec[t])
      ) {
        output.push(ops.pop()!)
      }
      ops.push(t)
    }
  }
  while (ops.length) output.push(ops.pop()!)

  const stack: number[] = []
  for (const t of output) {
    if (typeof t === "number") {
      stack.push(t)
    } else if (t === "sqrt") {
      const a = stack.pop()!
      stack.push(Math.sqrt(a))
    } else {
      const b = stack.pop()!
      const a = stack.pop()!
      if (t === "+") stack.push(a + b)
      else if (t === "-") stack.push(a - b)
      else if (t === "*") stack.push(a * b)
      else if (t === "/") stack.push(b !== 0 ? a / b : NaN)
      else if (t === "%") stack.push(b !== 0 ? a % b : NaN)
    }
  }
  return stack[0] ?? 0
}

function evalExpression(expr: string): string {
  if (!expr) return "0"
  try {
    const tokens = tokenize(expr)
    const result = evalTokens(tokens)
    if (Number.isNaN(result)) return "Error"
    return String(parseFloat(result.toFixed(10)))
  } catch {
    return "Error"
  }
}

export function CalculatorWidget() {
  const [open, setOpen] = useState(false)
  const [expression, setExpression] = useState("")
  const [display, setDisplay] = useState("0")
  const [justEvaluated, setJustEvaluated] = useState(false)
  const [memory, setMemory] = useState(0)

  const exprRef = useRef(expression)
  const displayRef = useRef(display)
  const justEvalRef = useRef(justEvaluated)

  useEffect(() => {
    exprRef.current = expression
  }, [expression])
  useEffect(() => {
    displayRef.current = display
  }, [display])
  useEffect(() => {
    justEvalRef.current = justEvaluated
  }, [justEvaluated])

  const updateExpr = useCallback(
    (expr: string, disp: string, evald: boolean) => {
      setExpression(expr)
      setDisplay(disp)
      setJustEvaluated(evald)
      exprRef.current = expr
      displayRef.current = disp
      justEvalRef.current = evald
    },
    []
  )

  const appendToken = useCallback(
    (token: string) => {
      const expr = exprRef.current
      const ev = justEvalRef.current

      if (ev) {
        if (token === ".") {
          updateExpr(".", "0.", false)
          return
        }
        if (token >= "0" && token <= "9") {
          updateExpr(token, token, false)
          return
        }
        if (token === "(" || token === "sqrt(") {
          updateExpr(token, token === "(" ? "(" : "sqrt(", false)
          return
        }
        const result = displayRef.current
        if (result === "Error") {
          updateExpr("", "0", false)
          return
        }
        const newExpr = result + token
        updateExpr(newExpr, result, false)
        return
      }

      if (token === "." && expr === "") {
        updateExpr(".", "0.", false)
        return
      }

      if (token === "." && expr.endsWith(".")) return

      const newExpr = expr + token
      setExpression(newExpr)
      exprRef.current = newExpr
      justEvalRef.current = false

      if ((token >= "0" && token <= "9") || token === ".") {
        const lastNumMatch = newExpr.match(/([\d.]+)$/)
        if (lastNumMatch) {
          setDisplay(lastNumMatch[1])
          displayRef.current = lastNumMatch[1]
        }
      }
    },
    [updateExpr]
  )

  const handleClear = useCallback(() => {
    updateExpr("", "0", false)
  }, [updateExpr])

  const handleBackspace = useCallback(() => {
    const expr = exprRef.current
    const ev = justEvalRef.current
    if (ev || !expr) {
      updateExpr("", "0", false)
      return
    }
    if (expr.endsWith("sqrt(")) {
      const trimmed = expr.slice(0, -5)
      updateExpr(trimmed, trimmed || "0", false)
      return
    }
    const trimmed = expr.slice(0, -1)
    if (!trimmed) {
      updateExpr("", "0", false)
      return
    }
    const lastNumMatch = trimmed.match(/([\d.]+)$/)
    setExpression(trimmed)
    exprRef.current = trimmed
    setDisplay(lastNumMatch ? lastNumMatch[1] : "0")
    displayRef.current = lastNumMatch ? lastNumMatch[1] : "0"
  }, [updateExpr])

  const handleEquals = useCallback(() => {
    const expr = exprRef.current
    if (!expr) return
    const result = evalExpression(expr)
    updateExpr(result, result, true)
  }, [updateExpr])

  const handleSqrt = useCallback(() => {
    const ev = justEvalRef.current
    if (ev) {
      const val = displayRef.current
      if (val === "Error") {
        updateExpr("", "0", false)
        return
      }
      const n = Number(val)
      if (n < 0) {
        updateExpr("sqrt(" + val + ")", "Error", true)
        return
      }
      const r = String(parseFloat(Math.sqrt(n).toFixed(10)))
      updateExpr("sqrt(" + val + ")", r, true)
      return
    }
    appendToken("sqrt(")
  }, [appendToken, updateExpr])

  const handleSquare = useCallback(() => {
    const ev = justEvalRef.current
    if (ev) {
      const val = displayRef.current
      if (val === "Error") {
        updateExpr("", "0", false)
        return
      }
      const n = Number(val)
      const r = String(parseFloat((n * n).toFixed(10)))
      updateExpr("(" + val + ")²", r, true)
      return
    }
    const expr = exprRef.current
    if (!expr) return
    const val = displayRef.current
    const n = Number(val)
    const r = String(parseFloat((n * n).toFixed(10)))
    const newExpr = "(" + expr + ")²"
    updateExpr(newExpr, r, false)
  }, [updateExpr])

  const handleReciprocal = useCallback(() => {
    const val = displayRef.current
    const ev = justEvalRef.current
    if (val === "Error") {
      updateExpr("", "0", false)
      return
    }
    const n = Number(val)
    if (n === 0) {
      updateExpr("1/(" + val + ")", "Error", true)
      return
    }
    const r = String(parseFloat((1 / n).toFixed(10)))
    if (ev) {
      updateExpr("1/(" + val + ")", r, true)
    } else {
      appendToken("/")
    }
  }, [appendToken, updateExpr])

  const handlePercent = useCallback(() => {
    const val = displayRef.current
    const ev = justEvalRef.current
    if (val === "Error") return
    const n = Number(val)
    const r = String(parseFloat((n / 100).toFixed(10)))
    if (ev) {
      updateExpr(val + "%", r, true)
    } else {
      appendToken("%")
    }
  }, [appendToken, updateExpr])

  const handleToggleSign = useCallback(() => {
    const expr = exprRef.current
    const val = displayRef.current
    const ev = justEvalRef.current
    if (val === "Error") return
    if (ev) {
      const n = Number(val)
      if (n === 0) return
      const r = String(-n)
      updateExpr(r, r, true)
      return
    }
    if (!expr) return
    const lastNumMatch = expr.match(/([\d.]+)$/)
    if (!lastNumMatch) return
    const num = lastNumMatch[1]
    const pos = expr.length - num.length
    const before = expr.slice(0, pos)
    let newExpr: string
    if (before.endsWith("-")) {
      newExpr = before.slice(0, -1) + "+" + num
    } else if (before.endsWith("+")) {
      newExpr = before.slice(0, -1) + "-" + num
    } else if (num.startsWith("-")) {
      newExpr = before + num.slice(1)
    } else {
      newExpr = before + "-" + num
    }
    const lastMatch = newExpr.match(/(-?[\d.]+)$/)
    setExpression(newExpr)
    exprRef.current = newExpr
    if (lastMatch) {
      setDisplay(lastMatch[1])
      displayRef.current = lastMatch[1]
    }
  }, [updateExpr])

  const handleMemoryOp = useCallback(
    (op: string) => {
      const val = displayRef.current
      const n = val === "Error" ? 0 : Number(val)
      switch (op) {
        case "MC":
          setMemory(0)
          break
        case "MR":
          if (memory !== 0) {
            const r = String(memory)
            updateExpr(r, r, true)
          }
          break
        case "M+":
          setMemory((m) => m + n)
          break
        case "M-":
          setMemory((m) => m - n)
          break
      }
    },
    [memory, updateExpr]
  )

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      const key = e.key

      if (key >= "0" && key <= "9") {
        e.stopImmediatePropagation()
        appendToken(key)
        return
      }
      if (key === ".") {
        e.stopImmediatePropagation()
        appendToken(".")
        return
      }
      if (key === "+") {
        e.stopImmediatePropagation()
        appendToken("+")
        return
      }
      if (key === "-") {
        e.stopImmediatePropagation()
        appendToken("-")
        return
      }
      if (key === "*") {
        e.stopImmediatePropagation()
        appendToken("*")
        return
      }
      if (key === "/") {
        e.stopImmediatePropagation()
        appendToken("/")
        return
      }
      if (key === "%") {
        e.stopImmediatePropagation()
        handlePercent()
        return
      }
      if (key === "(") {
        e.stopImmediatePropagation()
        appendToken("(")
        return
      }
      if (key === ")") {
        e.stopImmediatePropagation()
        appendToken(")")
        return
      }
      if (key === "Enter") {
        e.stopImmediatePropagation()
        handleEquals()
        return
      }
      if (key === "=") {
        e.stopImmediatePropagation()
        handleEquals()
        return
      }
      if (key === "Backspace") {
        e.stopImmediatePropagation()
        handleBackspace()
        return
      }
      if (key === "Escape") {
        e.stopImmediatePropagation()
        handleClear()
        return
      }
      if (key === "s") {
        e.stopImmediatePropagation()
        handleSqrt()
        return
      }
      if (key === "q") {
        e.stopImmediatePropagation()
        handleSquare()
        return
      }
      if (key === "r") {
        e.stopImmediatePropagation()
        handleReciprocal()
        return
      }
    }
    window.addEventListener("keydown", handleKey, true)
    return () => window.removeEventListener("keydown", handleKey, true)
  }, [
    open,
    appendToken,
    handleEquals,
    handleBackspace,
    handleClear,
    handlePercent,
    handleSqrt,
    handleSquare,
    handleReciprocal,
  ])

  const displayExpr = formatExpr(expression)

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed right-6 bottom-6 z-50 size-12 rounded-full shadow-lg"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close calculator" : "Open calculator"}
      >
        {open ? <X className="size-5" /> : <CalcIcon className="size-5" />}
      </Button>

      <div
        data-state={open ? "open" : "closed"}
        className="calc-panel fixed right-6 bottom-20 z-50 w-72 rounded-xl border border-border/60 bg-card/95 p-3 shadow-xl backdrop-blur-xl"
        role="application"
        aria-label="Calculator"
      >
        <div className="mb-2 rounded-lg bg-muted/50 px-3 py-1.5 text-right">
          <div
            className={cn(
              "truncate text-muted-foreground text-xs tabular-nums",
              displayExpr.length > 20 && "text-[10px]"
            )}
          >
            {displayExpr || "\u00A0"}
          </div>
          <div
            className={cn(
              "truncate font-bold tabular-nums",
              display.length > 12
                ? "text-lg"
                : display.length > 9
                  ? "text-xl"
                  : "text-2xl"
            )}
          >
            {formatNum(display)}
          </div>
        </div>

        <div className="mb-1.5 grid grid-cols-5 gap-1">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label="Memory Clear"
            onClick={() => handleMemoryOp("MC")}
            className="h-8 font-medium text-muted-foreground text-xs"
          >
            MC
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label="Memory Recall"
            onClick={() => handleMemoryOp("MR")}
            className="h-8 font-medium text-muted-foreground text-xs"
          >
            MR
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label="Memory Plus"
            onClick={() => handleMemoryOp("M+")}
            className="h-8 font-medium text-muted-foreground text-xs"
          >
            M+
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label="Memory Minus"
            onClick={() => handleMemoryOp("M-")}
            className="h-8 font-medium text-muted-foreground text-xs"
          >
            M-
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label="Toggle sign"
            onClick={handleToggleSign}
            className="h-8 font-medium text-muted-foreground text-xs"
          >
            +/−
          </Button>
        </div>

        <div className="grid grid-cols-5 gap-1">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label="Clear"
            onClick={handleClear}
            className="h-10 font-semibold text-destructive text-sm"
          >
            C
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label="Backspace"
            onClick={handleBackspace}
            className="h-10 font-semibold text-muted-foreground text-sm"
          >
            ⌫
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label="Percent"
            onClick={handlePercent}
            className="h-10 font-semibold text-muted-foreground text-sm"
          >
            %
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label="Reciprocal"
            onClick={handleReciprocal}
            className="h-10 font-semibold text-muted-foreground text-sm"
          >
            1/x
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label="Divide"
            onClick={() => appendToken("/")}
            className="h-10 border-primary/20 bg-primary/20 font-semibold text-primary text-sm hover:bg-primary/30"
          >
            ÷
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label="Square root"
            onClick={handleSqrt}
            className="h-10 font-semibold text-muted-foreground text-sm"
          >
            √
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="7"
            onClick={() => appendToken("7")}
            className="h-10 font-semibold text-sm"
          >
            7
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="8"
            onClick={() => appendToken("8")}
            className="h-10 font-semibold text-sm"
          >
            8
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="9"
            onClick={() => appendToken("9")}
            className="h-10 font-semibold text-sm"
          >
            9
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label="Multiply"
            onClick={() => appendToken("*")}
            className="h-10 border-primary/20 bg-primary/20 font-semibold text-primary text-sm hover:bg-primary/30"
          >
            ×
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label="x squared"
            onClick={handleSquare}
            className="h-10 font-semibold text-muted-foreground text-sm"
          >
            x²
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="4"
            onClick={() => appendToken("4")}
            className="h-10 font-semibold text-sm"
          >
            4
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="5"
            onClick={() => appendToken("5")}
            className="h-10 font-semibold text-sm"
          >
            5
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="6"
            onClick={() => appendToken("6")}
            className="h-10 font-semibold text-sm"
          >
            6
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label="Subtract"
            onClick={() => appendToken("-")}
            className="h-10 border-primary/20 bg-primary/20 font-semibold text-primary text-sm hover:bg-primary/30"
          >
            −
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label="Open parenthesis"
            onClick={() => appendToken("(")}
            className="h-10 font-semibold text-muted-foreground text-sm"
          >
            (
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="1"
            onClick={() => appendToken("1")}
            className="h-10 font-semibold text-sm"
          >
            1
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="2"
            onClick={() => appendToken("2")}
            className="h-10 font-semibold text-sm"
          >
            2
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="3"
            onClick={() => appendToken("3")}
            className="h-10 font-semibold text-sm"
          >
            3
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label="Add"
            onClick={() => appendToken("+")}
            className="h-10 border-primary/20 bg-primary/20 font-semibold text-primary text-sm hover:bg-primary/30"
          >
            +
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label="Close parenthesis"
            onClick={() => appendToken(")")}
            className="h-10 font-semibold text-muted-foreground text-sm"
          >
            )
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="0"
            onClick={() => appendToken("0")}
            className="h-10 font-semibold text-sm"
          >
            0
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Decimal point"
            onClick={() => appendToken(".")}
            className="h-10 font-semibold text-sm"
          >
            .
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            aria-label="Equals"
            onClick={handleEquals}
            className="col-span-2 h-10 font-bold text-sm"
          >
            =
          </Button>
        </div>
      </div>
    </>
  )
}
