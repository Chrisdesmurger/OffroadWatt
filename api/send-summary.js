export const config = { runtime: 'edge' }

const RESEND_API = 'https://api.resend.com/emails'

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() })
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const key = process.env.RESEND_API_KEY
  if (!key) return new Response('Missing RESEND_API_KEY', { status: 500 })

  let body
  try { body = await req.json() } catch { return new Response('Bad JSON', { status: 400 }) }

  const { email, subject, html } = body
  if (!email || !html) return new Response('Missing email or html', { status: 400 })

  const from = process.env.RESEND_FROM || 'OffroadWatt <onboarding@resend.dev>'

  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [email], subject: subject || 'Votre récapitulatif OffroadWatt', html }),
  })

  const data = await res.json()
  if (!res.ok) return new Response(JSON.stringify(data), { status: res.status, headers: { 'Content-Type': 'application/json', ...corsHeaders() } })
  return new Response(JSON.stringify({ ok: true, id: data.id }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } })
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}
