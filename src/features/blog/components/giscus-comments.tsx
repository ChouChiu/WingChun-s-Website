import Giscus from "@giscus/react"
import { useEffect, useRef, useState } from "react"

const GISCUS_ORIGIN = "https://giscus.app"
const RETRY_DELAYS = [300, 800, 1500, 3000]

const config = {
  repo: "ChouChiu/chore" as const,
  repoId: "R_kgDOSyhzag",
  category: "General",
  categoryId: "DIC_kwDOSyhzas4C-oUT",
  mapping: "pathname" as const,
}

function getThemeUrl(theme: "light" | "dark") {
  if (window.location.hostname === "localhost") return theme
  return `${window.location.origin}/giscus-${theme}.css`
}

function isDarkMode() {
  return document.documentElement.classList.contains("dark")
}

function useDarkMode() {
  const [dark, setDark] = useState(isDarkMode)

  useEffect(() => {
    const observer = new MutationObserver(() => setDark(isDarkMode()))
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => observer.disconnect()
  }, [])

  return dark
}

function sendTheme(
  iframe: HTMLIFrameElement | null | undefined,
  theme: "light" | "dark"
) {
  if (!iframe?.contentWindow) return
  iframe.contentWindow.postMessage(
    { giscus: { setConfig: { theme: getThemeUrl(theme) } } },
    GISCUS_ORIGIN
  )
}

function sendThemeWithRetry(
  iframe: HTMLIFrameElement | null | undefined,
  theme: "light" | "dark"
) {
  sendTheme(iframe, theme)
  for (const delay of RETRY_DELAYS) {
    setTimeout(() => sendTheme(iframe, theme), delay)
  }
}

function findGiscusIframe(container: HTMLElement): HTMLIFrameElement | null {
  const direct = container.querySelector<HTMLIFrameElement>(
    "iframe.giscus-frame"
  )
  if (direct) return direct

  const widget = container.querySelector<HTMLElement>("giscus-widget")
  if (widget?.shadowRoot) {
    return widget.shadowRoot.querySelector<HTMLIFrameElement>("iframe")
  }

  return null
}

export function GiscusComments() {
  const dark = useDarkMode()
  const theme: "light" | "dark" = dark ? "dark" : "light"
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const themeRef = useRef(theme)
  themeRef.current = theme

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    function onIframeFound(found: HTMLIFrameElement) {
      iframeRef.current = found
      found.addEventListener("load", () => {
        if (iframeRef.current) {
          sendThemeWithRetry(iframeRef.current, themeRef.current)
        }
      })
    }

    const existing = findGiscusIframe(container)
    if (existing) {
      onIframeFound(existing)
      return
    }

    const observer = new MutationObserver(() => {
      const found = findGiscusIframe(container)
      if (found) {
        observer.disconnect()
        onIframeFound(found)
      }
    })
    observer.observe(container, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    sendThemeWithRetry(iframeRef.current, theme)
  }, [theme])

  return (
    <div ref={containerRef}>
      <Giscus
        {...config}
        theme={getThemeUrl(theme)}
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        lang="zh-CN"
        loading="eager"
      />
    </div>
  )
}
