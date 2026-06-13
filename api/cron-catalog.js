export const config = { runtime: 'edge' }

// ─── Agent hebdomadaire d'enrichissement du catalogue ─────────────────────────
// Déclenché par Vercel Cron (voir vercel.json → crons). Chaque exécution :
//   1. choisit UNE catégorie en rotation (basée sur le numéro de semaine ISO)
//   2. demande à Claude des modèles réels de cette catégorie absents du catalogue
//   3. INSÈRE uniquement les nouveautés — jamais d'update, jamais de suppression
//
// Sécurité : Vercel ajoute l'en-tête Authorization: Bearer $CRON_SECRET si la
// variable CRON_SECRET est définie. On la vérifie si présente.

const SB_URL = process.env.SUPABASE_URL || 'https://ofjpskrjlwfebaqomijm.supabase.co'
const SB_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9manBza3JqbHdmZWJhcW9taWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwODIzMTMsImV4cCI6MjA5NTY1ODMxM30.R2hqPwmvihdgVv7rwLp0r--Jo0Qp6m6ORc-PU4M58n8'

// Catégories de l'application (hors "Tout") + icône Tabler par défaut
const CATEGORIES = ['Cuisine', 'Confort', 'Tech', 'Eau', 'Éclairage', 'Système']
const ICON_BY_CAT = {
  Cuisine: 'ti-tools-kitchen-2', Confort: 'ti-temperature', Tech: 'ti-device-laptop',
  Eau: 'ti-droplet', 'Éclairage': 'ti-bulb', 'Système': 'ti-settings',
}

// Numéro de semaine ISO → rotation déterministe sans état stocké
function isoWeek(d = new Date()) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7)
}

const SYSTEM_PROMPT = `Tu es un expert en équipements électriques 12V/24V pour camping-car, van et caravane.
Tu connais précisément les modèles réels et leur consommation électrique moyenne réaliste en usage off-grid.

RÈGLES STRICTES :
- Ne propose que des produits RÉELS et identifiables (marque + modèle).
- watts = consommation électrique MOYENNE 12V réaliste (pas le pic).
  Pour les frigos à compresseur : moyenne avec cycle ~30% (ex. 12V 75L ≈ 55W moyens).
  Pour les chauffages à combustible (diesel/gaz) : UNIQUEMENT l'électrique
  (ventilateur + pompe + électronique), jamais la puissance thermique.
- hours = nombre d'heures d'utilisation typique par jour.
- Reste STRICTEMENT dans la catégorie demandée.
- N'inclus AUCUN modèle déjà présent dans la liste fournie.`

const TOOL = {
  name: 'add_equipment',
  description: 'Ajoute des équipements réels au catalogue',
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

const sbHeaders = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
}

export default async function handler(req) {
  // Vérif du secret cron si configuré
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization') || ''
    if (auth !== `Bearer ${secret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }
  }

  const apiKey = process.env.ANTHROPIC_KEY || process.env.VITE_ANTHROPIC_KEY
  if (!apiKey) return new Response(JSON.stringify({ error: 'ANTHROPIC_KEY manquante' }), { status: 500 })

  const category = CATEGORIES[isoWeek() % CATEGORIES.length]

  try {
    // 1. Modèles déjà présents dans cette catégorie
    const existingRes = await fetch(
      `${SB_URL}/rest/v1/equipment_catalog?select=name&category=eq.${encodeURIComponent(category)}`,
      { headers: sbHeaders }
    )
    const existing = existingRes.ok ? await existingRes.json() : []
    const existingNames = new Set(existing.map(r => (r.name || '').toLowerCase().trim()))

    // 2. Claude propose des nouveautés
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        temperature: 0,
        system: SYSTEM_PROMPT,
        tools: [TOOL],
        tool_choice: { type: 'tool', name: 'add_equipment' },
        messages: [{
          role: 'user',
          content: `Catégorie : "${category}".
Propose 10 à 15 équipements RÉELS de cette catégorie utilisés en camping-car/van, avec leur consommation électrique moyenne 12V réaliste.
Modèles DÉJÀ présents (à NE PAS répéter) :
${[...existingNames].slice(0, 200).join('\n') || '(aucun)'}`,
        }],
      }),
    })

    if (!aiRes.ok) {
      const err = await aiRes.text()
      return new Response(JSON.stringify({ error: 'Anthropic', detail: err }), { status: 502 })
    }

    const data = await aiRes.json()
    const result = data?.content?.find(b => b.type === 'tool_use')?.input
    const items = Array.isArray(result?.items) ? result.items : []

    // 3. Filtre les doublons (insertion seule) puis insère
    const seen = new Set(existingNames)
    const toInsert = []
    for (const it of items) {
      const key = (it.name || '').toLowerCase().trim()
      if (!key || seen.has(key)) continue
      seen.add(key)
      toInsert.push({
        name: it.name,
        brand: it.brand || '',
        category,
        icon: ICON_BY_CAT[category] || 'ti-plug',
        watts: Number(it.watts) || null,
        hours: it.hours != null ? Number(it.hours) : 4,
        voltage: Number(it.voltage) || 12,
      })
    }

    let inserted = 0
    if (toInsert.length) {
      // on_conflict=name,brand + ignore-duplicates : ne touche jamais l'existant
      const insRes = await fetch(
        `${SB_URL}/rest/v1/equipment_catalog?on_conflict=name,brand`,
        {
          method: 'POST',
          headers: { ...sbHeaders, Prefer: 'resolution=ignore-duplicates,return=representation' },
          body: JSON.stringify(toInsert),
        }
      )
      if (insRes.ok) {
        const rows = await insRes.json()
        inserted = Array.isArray(rows) ? rows.length : toInsert.length
      } else {
        const err = await insRes.text()
        return new Response(JSON.stringify({ error: 'Supabase insert', detail: err, category }), { status: 502 })
      }
    }

    return new Response(JSON.stringify({
      ok: true, category, week: isoWeek(), proposed: items.length, inserted,
    }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e), category }), { status: 500 })
  }
}
