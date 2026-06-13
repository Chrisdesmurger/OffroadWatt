export const config = { runtime: 'edge' }

// ─── Recherche admin à la demande ─────────────────────────────────────────────
// Propose des équipements réels pour une catégorie (et un mot-clé optionnel)
// SANS rien insérer. L'admin valide ensuite côté client avant d'écrire en base.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const SB_URL = process.env.SUPABASE_URL || 'https://ofjpskrjlwfebaqomijm.supabase.co'
const SB_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9manBza3JqbHdmZWJhcW9taWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwODIzMTMsImV4cCI6MjA5NTY1ODMxM30.R2hqPwmvihdgVv7rwLp0r--Jo0Qp6m6ORc-PU4M58n8'

const SYSTEM_PROMPT = `Tu es un expert en équipements électriques 12V/24V pour camping-car, van et caravane.
Tu connais précisément les modèles réels et leur consommation électrique moyenne réaliste en usage off-grid.

RÈGLES STRICTES :
- Ne propose que des produits RÉELS et identifiables (marque + modèle).
- watts = consommation électrique MOYENNE 12V réaliste (pas le pic).
  Frigos à compresseur : moyenne avec cycle ~30% (ex. 12V 75L ≈ 55W moyens).
  Chauffages à combustible (diesel/gaz) : UNIQUEMENT l'électrique (ventilateur + pompe + électronique), jamais la puissance thermique.
- hours = nombre d'heures d'utilisation typique par jour.
- Reste STRICTEMENT dans la catégorie demandée.
- N'inclus AUCUN modèle déjà présent dans la liste fournie.`

const TOOL = {
  name: 'propose_equipment',
  description: 'Propose des équipements réels pour le catalogue',
  input_schema: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Nom complet : type + capacité + (Marque Modèle)' },
            brand: { type: 'string', description: 'Marque' },
            watts: { type: 'number', description: 'Consommation électrique moyenne 12V en watts' },
            hours: { type: 'number', description: 'Heures d\'utilisation typiques par jour' },
            voltage: { type: 'number', description: '12 ou 24' },
          },
          required: ['name', 'brand', 'watts', 'hours'],
        },
      },
    },
    required: ['items'],
  },
}

const CATEGORIES = ['Cuisine', 'Confort', 'Tech', 'Eau', 'Éclairage', 'Système']

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: CORS })

  let body
  try { body = await req.json() } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: CORS }) }

  const category = CATEGORIES.includes(body?.category) ? body.category : 'Cuisine'
  const query = (body?.query || '').trim()
  const count = Math.min(Math.max(parseInt(body?.count) || 12, 1), 25)

  const apiKey = process.env.ANTHROPIC_KEY || process.env.VITE_ANTHROPIC_KEY
  if (!apiKey) return new Response(JSON.stringify({ error: 'ANTHROPIC_KEY manquante' }), { status: 500, headers: CORS })

  try {
    // Modèles déjà en base dans cette catégorie (pour éviter les doublons)
    const existRes = await fetch(
      `${SB_URL}/rest/v1/equipment_catalog?select=name&category=eq.${encodeURIComponent(category)}`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    )
    const existing = existRes.ok ? await existRes.json() : []
    const existingNames = existing.map(r => (r.name || '').toLowerCase().trim())

    const userMsg = `Catégorie : "${category}".${query ? `\nFocus : ${query}.` : ''}
Propose ${count} équipements RÉELS de cette catégorie utilisés en camping-car/van, avec leur consommation électrique moyenne 12V réaliste.
Modèles DÉJÀ présents (à NE PAS répéter) :
${existingNames.slice(0, 200).join('\n') || '(aucun)'}`

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        temperature: 0,
        system: SYSTEM_PROMPT,
        tools: [TOOL],
        tool_choice: { type: 'tool', name: 'propose_equipment' },
        messages: [{ role: 'user', content: userMsg }],
      }),
    })

    if (!aiRes.ok) {
      const err = await aiRes.text()
      return new Response(JSON.stringify({ error: 'Anthropic', detail: err }), { status: 502, headers: CORS })
    }

    const data = await aiRes.json()
    const result = data?.content?.find(b => b.type === 'tool_use')?.input
    const items = Array.isArray(result?.items) ? result.items : []

    // Marque les doublons sans les retirer (info pour l'admin)
    const existSet = new Set(existingNames)
    const enriched = items.map(it => ({
      name: it.name,
      brand: it.brand || '',
      watts: Number(it.watts) || null,
      hours: it.hours != null ? Number(it.hours) : 4,
      voltage: Number(it.voltage) || 12,
      category,
      duplicate: existSet.has((it.name || '').toLowerCase().trim()),
    }))

    return new Response(JSON.stringify({ ok: true, category, items: enriched }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: CORS })
  }
}
