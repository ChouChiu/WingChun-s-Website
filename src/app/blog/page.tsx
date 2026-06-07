import { Suspense } from "react"
import { getAllPosts } from "@/features/blog/lib/blog"
import { BlogList } from "@/features/blog/pages/blog-list"

export default function Page() {
  const posts = getAllPosts()
  return (
    <Suspense>
      <BlogList posts={posts} />
    </Suspense>
  )
}
