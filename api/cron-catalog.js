export const config = { runtime: 'edge' }

const SB_URL = process.env.SUPABASE_URL || 'https://ofjpskrjlwfebaqomijm.supabase.co'
const SB_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9manBza3JqbHdmZWJhcW9taWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwODIzMTMsImV4cCI6MjA5NTY1ODMxM30.R2hqPwmvihdgVv7rwLp0r--Jo0Qp6m6ORc-PU4M58n8'

const CATEGORIES = ['Cuisine', 'Confort', 'Tech', 'Eau', 'Éclairage', 'Système']
const ICON_BY_CAT = {
  Cuisine: 'ti-tools-kitchen-2', Confort: 'ti-temperature', Tech: 'ti-device-laptop',
  Eau: 'ti-droplet', 'Éclairage': 'ti-bulb', 'Système': 'ti-settings',
}

const EQUIPMENT_BRANDS = {
  Cuisine:    ['Dometic', 'Comet', 'ENO', 'Campingaz', 'Smev', 'Thetford', 'Beem', 'Severin'],
  Confort:    ['Webasto', 'Eberspächer', 'Espar', 'Truma', 'Propex', 'Planar', 'Autoterm', 'Dometic'],
  Tech:       ['Victron Energy', 'Renogy', 'Epever', 'Votronic', 'Büttner', 'CTEK', 'Sterling', 'Garmin'],
  Eau:        ['Seaflo', 'Shurflo', 'Whale', 'Jabsco', 'Flojet', 'Marco', 'Truma'],
  Éclairage: ['Narva', 'Ring', 'Hella', 'LED Autolamps', 'Osram', 'Rigid Industries', 'ProPlus'],
  Système:    ['Victron Energy', 'Renogy', 'Mastervolt', 'Studer', 'Votronic', 'CTEK', 'Büttner'],
}

function isoWeek(d = new Date()) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7)
}

const SYSTEM_PROMPT = `Tu es un expert en équipements électriques 12V/24V pour camping-car, van et caravane.
Tu connais précisément les modèles réels et leur consommation électrique moyenne réaliste en usage off-grid.

MARQUES D'ÉQUIPEMENTS PRIORITAIRES :
- Cuisine : Dometic, Comet, ENO, Campingaz, Smev, Thetford
- Confort : Webasto, Eberspächer/Espar, Truma, Propex, Planar, Autoterm, Dometic
- Tech/Électrique : Victron Energy, Renogy, Epever, Votronic, Büttner, CTEK, Sterling
- Eau : Seaflo, Shurflo, Whale, Jabsco, Flojet, Marco, Truma
- Éclairage : Narva, Ring, Hella, LED Autolamps, Osram, Rigid Industries
- Système : Victron Energy, Renogy, Mastervolt, Studer, Votronic, CTEK, Büttner

MARCHÉ CAMPING-CAR (contexte) :
- Haut de gamme : Hymer, Carthago, Niesmann & Bischoff, Frankia, EuraMobil, Mobilvetta
- Milieu de gamme : Bailey, Elddis, AutoSleeper, Dethleffs, Bürstner, Pilote, Chausson
- Entrée de gamme : Adria, Carado, Sunlight, Swift, Benimar, Laika, Jayco, Avida, Nebula

RÈGLES STRICTES :
- Ne propose que des produits RÉELS et identifiables (marque + modèle précis).
- watts = consommation électrique MOYENNE 12V réaliste (pas le pic).
  Frigos à compresseur : moyenne avec cycle ~30% (ex. 12V 75L ≈ 55W moyens).
  Chauffages à combustible (diesel/gaz) : UNIQUEMENT l'électrique.
- hours = nombre d'heures d'utilisation typique par jour.
- Reste STRICTEMENT dans la catégorie demandée.
- Utilise search_existing pour éviter les doublons.
- Varie les gammes de prix (entrée / milieu / haut de gamme).`

const TOOLS = [
  {
    name: 'search_existing',
    description: 'Vérifie ce qui est déjà dans le catalogue pour éviter les doublons.',
    input_schema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: 'Marque, type ou modèle à vérifier' },
      },
      required: ['keyword'],
    },
  },
  {
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
              name:    { type: 'string' },
              brand:   { type: 'string' },
              watts:   { type: 'number' },
              hours:   { type: 'number' },
              voltage: { type: 'number' },
            },
            required: ['name', 'brand', 'watts', 'hours'],
          },
        },
      },
      required: ['items'],
    },
  },
]

const sbHeaders = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
}

async function searchExisting(keyword, category) {
  const url = `${SB_URL}/rest/v1/equipment_catalog?select=name,brand&or=(name.ilike.*${encodeURIComponent(keyword)}*,brand.ilike.*${encodeURIComponent(keyword)}*)&category=eq.${encodeURIComponent(category)}&limit=20`
  const res = await fetch(url, { headers: sbHeaders })
  if (!res.ok) return []
  return (await res.json()).map(r => `${r.name} (${r.brand || '—'})`)
}

export default async function handler(req) {
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
  const brandHints = (EQUIPMENT_BRANDS[category] || []).join(', ')

  try {
    const existingRes = await fetch(
      `${SB_URL}/rest/v1/equipment_catalog?select=name&category=eq.${encodeURIComponent(category)}`,
      { headers: sbHeaders }
    )
    const existing      = existingRes.ok ? await existingRes.json() : []
    const existingNames = new Set(existing.map(r => (r.name || '').toLowerCase().trim()))

    const userMsg = `Catégorie : "${category}".
Objectif : trouver 10 à 15 équipements NOUVEAUX et RÉELS absents du catalogue.
Marques prioritaires : ${brandHints}.
Déjà ${existing.length} équipements en base.

Stratégie :
1. Utilise search_existing par marque/type pour savoir ce qui manque.
2. Propose des équipements nouveaux variés (entrée/milieu/haut de gamme).
3. Tu peux faire plusieurs tours de recherche et proposition.`

    const messages = [{ role: 'user', content: userMsg }]
    const allProposed = []
    let rounds = 0

    while (rounds < 6) {
      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 4096,
          temperature: 0,
          system: SYSTEM_PROMPT,
          tools: TOOLS,
          tool_choice: { type: 'auto' },
          messages,
        }),
      })

      if (!aiRes.ok) {
        const err = await aiRes.text()
        return new Response(JSON.stringify({ error: 'Anthropic', detail: err, category }), { status: 502 })
      }

      const data = await aiRes.json()
      messages.push({ role: 'assistant', content: data.content })

      const toolUses = (data.content || []).filter(b => b.type === 'tool_use')
      if (!toolUses.length) break

      const toolResults = []
      for (const tu of toolUses) {
        if (tu.name === 'search_existing') {
          const found = await searchExisting(tu.input.keyword || '', category)
          toolResults.push({
            type: 'tool_result',
            tool_use_id: tu.id,
            content: found.length
              ? `${found.length} trouvé(s) :\n${found.join('\n')}`
              : 'Aucun résultat — cette marque/type n\'est pas encore dans le catalogue.',
          })
        } else if (tu.name === 'add_equipment') {
          allProposed.push(...(tu.input.items || []))
          toolResults.push({
            type: 'tool_result',
            tool_use_id: tu.id,
            content: `${(tu.input.items || []).length} reçus. Total : ${allProposed.length}. Continue si tu as d'autres propositions.`,
          })
        }
      }

      messages.push({ role: 'user', content: toolResults })
      rounds++
    }

    // Filtre doublons + insertion
    const seen = new Set(existingNames)
    const toInsert = []
    for (const it of allProposed) {
      const key = (it.name || '').toLowerCase().trim()
      if (!key || seen.has(key)) continue
      seen.add(key)
      toInsert.push({
        name:     it.name,
        brand:    it.brand || '',
        category,
        icon:     ICON_BY_CAT[category] || 'ti-plug',
        watts:    Number(it.watts) || null,
        hours:    it.hours != null ? Number(it.hours) : 4,
        voltage:  Number(it.voltage) || 12,
      })
    }

    let inserted = 0
    if (toInsert.length) {
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
      ok: true, category, week: isoWeek(), rounds, proposed: allProposed.length, inserted,
    }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e), category }), { status: 500 })
  }
}
