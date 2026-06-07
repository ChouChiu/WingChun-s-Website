import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { BlogPostPage, getAllPosts, getPostById } from "@/features/blog/index"

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({ id: post.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const post = getPostById(id)
  if (!post) return {}

  return {
    title: `${post.title} | ChouChiu 的網站`,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      publishedTime: post.date,
    },
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const post = getPostById(id)
  if (!post) notFound()

  return <BlogPostPage post={post} />
}
