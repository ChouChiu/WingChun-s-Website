import type { Metadata } from "next"
import { Layout } from "@/shared/components/layout/layout"
import { ThemeProvider } from "@/shared/components/layout/theme-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "ChouChiu 的網站",
  description: "歡迎來到 ChouChiu 的網站",
  openGraph: {
    title: "ChouChiu 的網站",
    description: "歡迎來到 ChouChiu 的網站",
    url: "https://wwchun.top",
    siteName: "ChouChiu 的網站",
    locale: "zh_TW",
    type: "website",
  },
}

const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark' || (t !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})()
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider disableTransitionOnChange={false}>
          <Layout>{children}</Layout>
        </ThemeProvider>
      </body>
    </html>
  )
}
