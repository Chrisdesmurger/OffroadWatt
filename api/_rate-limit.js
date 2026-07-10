const SB_URL = process.env.SUPABASE_URL || 'https://ofjpskrjlwfebaqomijm.supabase.co'
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const LIMIT_FREE = 5
const LIMIT_ANON = 3

export function getClientIp(req) {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') || '0.0.0.0'
}

async function sbFetch(path, { method = 'GET', body, token } = {}) {
  const key = token || SB_KEY
  if (!key) return null
  const headers = {
    apikey: SB_KEY,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: method === 'POST' ? 'return=minimal' : undefined,
  }
  Object.keys(headers).forEach(k => headers[k] === undefined && delete headers[k])
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  if (!res.ok) return null
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

async function resolveUser(req) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  if (!SB_KEY) return null

  const res = await fetch(`${SB_URL}/auth/v1/user`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  const user = await res.json()
  if (!user?.id) return null

  const profiles = await sbFetch(`profiles?id=eq.${user.id}&select=plan`)
  const plan = profiles?.[0]?.plan || 'free'
  return { id: user.id, plan }
}

async function countRecent(ip, userId, endpoint) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  if (userId) {
    const rows = await sbFetch(
      `ai_search_logs?select=id&user_id=eq.${userId}&endpoint=eq.${endpoint}&created_at=gte.${since}`,
    )
    return rows?.length ?? 0
  }

  const rows = await sbFetch(
    `ai_search_logs?select=id&user_id=is.null&ip=eq.${encodeURIComponent(ip)}&endpoint=eq.${endpoint}&created_at=gte.${since}`,
  )
  return rows?.length ?? 0
}

async function logSearch(ip, userId, endpoint) {
  await sbFetch('ai_search_logs', {
    method: 'POST',
    body: { ip, user_id: userId || null, endpoint },
  })
}

export async function checkRateLimit(req, endpoint, corsHeaders) {
  if (!SB_KEY) return null

  const ip = getClientIp(req)
  const user = await resolveUser(req)

  if (user?.plan === 'pro') {
    logSearch(ip, user.id, endpoint)
    return null
  }

  const limit = user ? LIMIT_FREE : LIMIT_ANON
  const count = await countRecent(ip, user?.id, endpoint)

  if (count >= limit) {
    const retryAfterSec = 3600
    return new Response(
      JSON.stringify({
        error: 'rate_limit',
        message: user
          ? `Daily limit reached (${LIMIT_FREE} searches/day). Upgrade to Pro for unlimited searches.`
          : `Daily limit reached (${LIMIT_ANON} searches/day). Sign in for more or upgrade to Pro.`,
        limit,
        remaining: 0,
      }),
      {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(retryAfterSec) },
      },
    )
  }

  logSearch(ip, user?.id, endpoint)

  return null
}
