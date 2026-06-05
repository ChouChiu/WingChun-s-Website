import {
  createContext,
  type ReactNode,
  useContext,
  useRef,
  useState,
} from "react"

interface BlogContextValue {
  tocContent: string | null
  setTocContent: (content: string | null) => void
  tocLoading: boolean
  setTocLoading: (loading: boolean) => void
  tocCache: Map<string, string>
}

const BlogContext = createContext<BlogContextValue>({
  tocContent: null,
  setTocContent: () => {
    /* noop */
  },
  tocLoading: false,
  setTocLoading: () => {
    /* noop */
  },
  tocCache: new Map(),
})

export function BlogProvider({ children }: { children: ReactNode }) {
  const [tocContent, setTocContent] = useState<string | null>(null)
  const [tocLoading, setTocLoading] = useState(false)
  const tocCache = useRef(new Map<string, string>()).current

  return (
    <BlogContext.Provider
      value={{ tocContent, setTocContent, tocLoading, setTocLoading, tocCache }}
    >
      {children}
    </BlogContext.Provider>
  )
}

export function useBlogContext() {
  return useContext(BlogContext)
}
