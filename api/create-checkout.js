export const config = { runtime: 'edge' }

// Crée une session Stripe Checkout pour l'abonnement « OffroadWatt Pro » (4,99€/mois).
// Variables d'environnement requises (Vercel) :
//   STRIPE_SECRET_KEY  — clé secrète Stripe (sk_live_… ou sk_test_…)
//   STRIPE_PRICE_ID    — id du prix récurrent du produit Pro (price_…)
// Aucune dépendance Node — appel direct de l'API REST Stripe via fetch (Edge runtime).

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const secret = process.env.STRIPE_SECRET_KEY
  const priceId = process.env.STRIPE_PRICE_ID
  if (!secret || !priceId) return json({ error: 'Stripe not configured on server' }, 500)

  let body
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON body' }, 400) }

  const { userId, email } = body || {}
  if (!userId) return json({ error: 'Missing userId' }, 400)

  // Origine de l'app pour les URLs de retour (success / cancel).
  const origin =
    body.origin ||
    req.headers.get('origin') ||
    (req.headers.get('referer') ? new URL(req.headers.get('referer')).origin : 'https://app.offroadwatt.com')

  // Stripe attend du x-www-form-urlencoded.
  const form = new URLSearchParams()
  form.set('mode', 'subscription')
  form.set('line_items[0][price]', priceId)
  form.set('line_items[0][quantity]', '1')
  form.set('client_reference_id', userId)
  form.set('success_url', `${origin}/?checkout=success`)
  form.set('cancel_url', `${origin}/?checkout=cancel`)
  form.set('allow_promotion_codes', 'true')
  // Permet de retrouver l'utilisateur dans le webhook même sur les events liés à l'abonnement.
  form.set('subscription_data[metadata][supabase_user_id]', userId)
  form.set('metadata[supabase_user_id]', userId)
  if (email) form.set('customer_email', email)

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) return json({ error: data.error?.message || `Stripe ${res.status}` }, res.status)

  return json({ url: data.url })
}
