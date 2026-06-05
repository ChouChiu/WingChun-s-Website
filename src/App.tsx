import { BrowserRouter, Route, Routes } from "react-router-dom"
import { BlogPage, BlogPostPage } from "@/features/blog/index"
import { HomePage } from "@/features/home/index"
import { HwListPage } from "@/features/hw-list/index"
import {
  CoordGamePage,
  MathGamePage,
  PercentageGamePage,
} from "@/features/math-games/index"
import { Layout } from "@/shared/components/layout/layout"

export function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:id" element={<BlogPostPage />} />
          <Route path="/math-game" element={<MathGamePage />} />
          <Route
            path="/math-game/percentage-game"
            element={<PercentageGamePage />}
          />
          <Route path="/math-game/coord-game" element={<CoordGamePage />} />
          <Route path="/hw-list" element={<HwListPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
