import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Layout } from "@/components/layout"
import { HomePage } from "@/pages/home"
import { BlogPage } from "@/pages/blog"
import { BlogPostPage } from "@/pages/blog-post"
import { MathGamePage } from "@/pages/math-game"
import { PercentageGamePage } from "@/pages/percentage-game"
import { CoordGamePage } from "@/pages/coord-game"
import { HwListPage } from "@/pages/hw-list"

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
