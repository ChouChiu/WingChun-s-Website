import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import { ThemeProvider } from "@/shared/components/layout/theme-provider"
import App from "./App.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider disableTransitionOnChange={false}>
      <App />
    </ThemeProvider>
  </StrictMode>
)
