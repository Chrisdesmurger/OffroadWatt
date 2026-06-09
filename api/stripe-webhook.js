export const config = { runtime: 'edge' }

// Webhook Stripe — met à jour `profiles.plan` dans Supabase selon l'état de l'abonnement.
// Variables d'environnement requises (Vercel) :
//   STRIPE_WEBHOOK_SECRET       — secret de signature de l'endpoint webhook (whsec_…)
//   SUPABASE_URL                — ex. https://ofjpskrjlwfebaqomijm.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY   — clé service_role (server-side uniquement, bypass RLS)
//
// Events écoutés :
//   checkout.session.completed       → plan = 'pro' + enregistre stripe_customer_id
//   customer.subscription.updated    → plan selon le statut (active/trialing → pro, sinon free)
//   customer.subscription.deleted    → plan = 'free'

const enc = new TextEncoder()

// Vérifie la signature Stripe (HMAC-SHA256) via Web Crypto — pas de SDK Node en Edge runtime.
async function verifyStripeSignature(payload, sigHeader, secret) {
  if (!sigHeader) return false
  const parts = Object.fromEntries(sigHeader.split(',').map(p => p.split('=')))
  const timestamp = parts.t
  const expected = parts.v1
  if (!timestamp || !expected) return false

  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(`${timestamp}.${payload}`))
  const computed = [...new Uint8Array(sigBuf)].map(b => b.toString(16).padStart(2, '0')).join('')

  // Comparaison à temps constant.
  if (computed.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}

async function updateProfile(filter, patch) {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error('Supabase service config missing')

  const res = await fetch(`${url}/rest/v1/profiles?${filter}`, {
    method: 'PATCH',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(patch),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`Supabase update failed ${res.status}: ${txt}`)
  }
}

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return new Response('Webhook secret not configured', { status: 500 })

  const raw = await req.text()
  const sig = req.headers.get('stripe-signature')

  const valid = await verifyStripeSignature(raw, sig, secret)
  if (!valid) return new Response('Invalid signature', { status: 400 })

  let event
  try { event = JSON.parse(raw) } catch { return new Response('Bad JSON', { status: 400 }) }

  try {
    const obj = event.data?.object || {}

    if (event.type === 'checkout.session.completed') {
      const userId = obj.client_reference_id || obj.metadata?.supabase_user_id
      const customerId = obj.customer
      if (userId) {
        const patch = { plan: 'pro' }
        if (customerId) patch.stripe_customer_id = customerId
        await updateProfile(`id=eq.${userId}`, patch)
      }
    } else if (event.type === 'customer.subscription.updated') {
      const active = obj.status === 'active' || obj.status === 'trialing'
      const userId = obj.metadata?.supabase_user_id
      const filter = userId ? `id=eq.${userId}` : `stripe_customer_id=eq.${obj.customer}`
      await updateProfile(filter, { plan: active ? 'pro' : 'free' })
    } else if (event.type === 'customer.subscription.deleted') {
      const userId = obj.metadata?.supabase_user_id
      const filter = userId ? `id=eq.${userId}` : `stripe_customer_id=eq.${obj.customer}`
      await updateProfile(filter, { plan: 'free' })
    }
  } catch (err) {
    return new Response(`Handler error: ${err.message}`, { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  })
}
