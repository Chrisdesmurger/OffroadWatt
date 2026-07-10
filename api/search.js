import { checkRateLimit } from './_rate-limit.js'

export const config = { runtime: 'edge' }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const system = `Tu es un expert en équipements électriques 12V pour camping-car, van et caravane.
Tu connais précisément les consommations électriques des marques Webasto, Truma, Dometic, Waeco, Victron, Shurflo, Fiamma et autres marques européennes.

RÈGLES STRICTES :
- Donne la consommation électrique 12V précise en watts pour chaque mode de fonctionnement
- Pour les chauffages à combustible (diesel/gaz) : watts = consommation électrique du ventilateur/pompe/électronique uniquement, PAS la puissance thermique
- Pour les appareils mixtes (gaz + 12V) : la partie électrique 12V uniquement
- Si plusieurs modes (veille, puissance min, max) : liste chaque mode dans "modes"
- Prix indicatifs marché européen en euros

Retourne UNIQUEMENT ce JSON valide, sans markdown, sans texte autour :
{"results":[{"name":"Nom complet","brand":"Marque","voltage":12,"price_eur":850,"description":"1-2 phrases usage camping-car/van","type":"chauffage|réfrigérateur|éclairage|pompe|ventilateur|convertisseur|...","efficiency":"classe si dispo","modes":[{"label":"Veille","watts":10},{"label":"Puissance min","watts":30},{"label":"Puissance max","watts":80}]}]}
Si un seul mode, "modes" contient un seul objet. Retourne 3 à 5 produits réels.`

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: CORS })

  let body
  try { body = await req.json() } catch { return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: CORS }) }

  const { query } = body || {}
  if (!query) return new Response(JSON.stringify({ error: 'Missing query' }), { status: 400, headers: CORS })

  const blocked = await checkRateLimit(req, 'search', CORS)
  if (blocked) return blocked

  const apiKey = process.env.ANTHROPIC_KEY || process.env.VITE_ANTHROPIC_KEY
  if (!apiKey) return new Response(JSON.stringify({ error: 'API key not configured on server' }), { status: 500, headers: CORS })

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      stream: true,
      system,
      messages: [{ role: 'user', content: `Recherche équipements 12V camping-car/van : ${query}` }],
    }),
  })

  if (!anthropicRes.ok) {
    const err = await anthropicRes.json().catch(() => ({}))
    return new Response(JSON.stringify({ error: err.error?.message || `Anthropic ${anthropicRes.status}` }), { status: anthropicRes.status, headers: CORS })
  }

  // Transformer le flux SSE Anthropic → text deltas bruts vers le client
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  let buffer = ''

  const transform = new TransformStream({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (raw === '[DONE]') continue
        try {
          const evt = JSON.parse(raw)
          if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
            controller.enqueue(encoder.encode(evt.delta.text))
          }
        } catch {}
      }
    },
    flush(controller) {
      if (buffer.startsWith('data: ')) {
        try {
          const evt = JSON.parse(buffer.slice(6))
          if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
            controller.enqueue(encoder.encode(evt.delta.text))
          }
        } catch {}
      }
    },
  })

  return new Response(anthropicRes.body.pipeThrough(transform), {
    headers: { ...CORS, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
  })
}
