import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { routes } from "./features/github-contribution/routes.js"

const app = new Hono()

app.use(
  "*",
  cors({
    origin: ["https://wwchun.top", "http://localhost:5173"],
    allowMethods: ["GET"],
    allowHeaders: ["Content-Type"],
  })
)

app.route("/api/github", routes)

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() })
})

const port = parseInt(process.env.PORT || "3001")

console.log(`Server starting on port ${port}...`)

serve({
  fetch: app.fetch,
  port,
})

console.log(`Server running at http://localhost:${port}`)
