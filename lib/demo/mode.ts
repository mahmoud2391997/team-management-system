const CACHE_TTL_MS = 30_000
const HEALTH_TIMEOUT_MS = 1500

/**
 * Cookie that marks the user as "logged out" of demo mode so the landing page
 * can render. Any real session (setSessionCookie) clears it again.
 */
export const DEMO_LOGOUT_COOKIE = 'demo-logout'

let demoCache: { value: boolean; at: number } | null = null

/**
 * Edge-safe, synchronous check that only looks at environment variables.
 * Returns true when DEMO_MODE is forced or when the Supabase credentials are
 * not configured at all (so the app can still boot without a database).
 */
export function isDemoConfigured(): boolean {
  const override = (process.env.DEMO_MODE || '').toLowerCase()
  if (override === '1' || override === 'true' || override === 'yes') return true

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) return true
  return false
}

/**
 * Performs a lightweight health check against the Supabase REST endpoint.
 * Any non-2xx response, a timeout, or a network failure means the database is
 * considered inactive and demo mode should be used.
 */
async function checkDatabaseHealth(): Promise<boolean> {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)?.replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) return true

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS)

    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: 'no-store',
      signal: controller.signal,
    })

    clearTimeout(timer)
    return res.status >= 200 && res.status < 300 ? false : true
  } catch {
    return true
  }
}

/**
 * Returns true when the app should run in demo mode: either because it is
 * configured (env), or because the database is missing/inactive.
 * Results are cached for CACHE_TTL_MS to avoid hammering the database.
 */
export async function ensureDemoMode(): Promise<boolean> {
  if (isDemoConfigured()) return true

  if (demoCache && Date.now() - demoCache.at < CACHE_TTL_MS) {
    return demoCache.value
  }

  const value = await checkDatabaseHealth()
  demoCache = { value, at: Date.now() }
  return value
}
