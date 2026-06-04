import { Hono } from 'hono'
import { cache } from './cache.js'
import { getContributionData } from './github.js'

const GITHUB_USERNAME = 'ChouChiu'

const routes = new Hono()

routes.get('/contributions/:owner/:repo', async (c) => {
  const owner = c.req.param('owner')
  const repo = c.req.param('repo')

  if (!owner || !repo) {
    return c.json({ error: 'Missing owner or repo parameter' }, 400)
  }

  const cacheKey = `${owner}:${repo}`

  const cached = cache.get(cacheKey)
  if (cached) {
    return c.json(cached.data)
  }

  try {
    const data = await getContributionData(owner, repo, GITHUB_USERNAME)
    cache.set(cacheKey, data)
    return c.json(data)
  } catch (error) {
    console.error('Error fetching contribution data:', error)
    return c.json({ error: 'Failed to fetch contribution data' }, 500)
  }
})

export { routes }
