import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Layout } from "@/shared/components/layout/layout"
import { HomePage } from "@/features/home/index"
import { BlogPage, BlogPostPage } from "@/features/blog/index"
import { MathGamePage, PercentageGamePage, CoordGamePage } from "@/features/math-games/index"
import { HwListPage } from "@/features/hw-list/index"

export function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:id" element={<BlogPostPage />} />
          <Route path="/math-game" element={<MathGamePage />} />
          <Route path="/math-game/percentage-game" element={<PercentageGamePage />} />
          <Route path="/math-game/coord-game" element={<CoordGamePage />} />
          <Route path="/hw-list" element={<HwListPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
