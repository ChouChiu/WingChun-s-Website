import { NextResponse } from "next/server"
import { getAllPosts } from "@/features/blog/lib/blog"

export async function GET() {
  const posts = getAllPosts()
  const metadata = posts.map(({ content: _content, ...rest }) => rest)
  return NextResponse.json(metadata)
}
