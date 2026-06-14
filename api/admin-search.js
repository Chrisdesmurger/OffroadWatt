export const config = { runtime: 'edge' }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const SB_URL = process.env.SUPABASE_URL || 'https://ofjpskrjlwfebaqomijm.supabase.co'
const SB_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9manBza3JqbHdmZWJhcW9taWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwODIzMTMsImV4cCI6MjA5NTY1ODMxM30.R2hqPwmvihdgVv7rwLp0r--Jo0Qp6m6ORc-PU4M58n8'

const EQUIPMENT_BRANDS = {
  Cuisine:    ['Dometic', 'Comet', 'ENO', 'Campingaz', 'Smev', 'Thetford', 'Beem', 'Severin', 'Omnivore'],
  Confort:    ['Webasto', 'Eberspächer', 'Espar', 'Truma', 'Propex', 'Planar', 'Autoterm', 'Dometic', 'Fiamma'],
  Tech:       ['Victron Energy', 'Renogy', 'Epever', 'Votronic', 'Büttner', 'CTEK', 'Sterling', 'Ring', 'Garmin', 'Navman'],
  Eau:        ['Seaflo', 'Shurflo', 'Whale', 'Jabsco', 'Flojet', 'Marco', 'Fiamma', 'Truma', 'Comet'],
  Éclairage: ['Narva', 'Ring', 'Hella', 'LED Autolamps', 'Osram', 'Rigid Industries', 'ProPlus', 'Berger'],
  Système:    ['Victron Energy', 'Renogy', 'Epever', 'SRNE', 'Votronic', 'Büttner', 'CTEK', 'Sterling', 'Mastervolt', 'Studer'],
}

const VEHICLE_BRANDS = {
  HighEnd: ['Hymer', 'Carthago', 'Niesmann & Bischoff', 'Frankia', 'EuraMobil', 'Mobilvetta', 'Wingamm', 'ACM'],
  Mid:     ['Bailey', 'Elddis', 'AutoSleeper', 'AutoTrail', 'Dethleffs', 'Bürstner', 'Pilote', 'Chausson', 'CI Magis'],
  Entry:   ['Adria', 'Carado', 'Sunlight', 'RollerTeam', 'Swift', 'Benimar', 'Laika', 'Jayco', 'Avida', 'Nebula'],
}

const SYSTEM_PROMPT = `Tu es un expert en équipements électriques 12V/24V pour camping-car, van et caravane.
Tu connais précisément les modèles réels et leur consommation électrique moyenne réaliste en usage off-grid.

MARQUES D'ÉQUIPEMENTS PRIORITAIRES (favorise ces fabricants reconnus) :
- Cuisine : Dometic, Comet, ENO, Campingaz, Smev, Thetford
- Confort : Webasto, Eberspächer/Espar, Truma, Propex, Planar, Autoterm, Dometic
- Tech/Électrique : Victron Energy, Renogy, Epever, Votronic, Büttner, CTEK, Sterling
- Eau : Seaflo, Shurflo, Whale, Jabsco, Flojet, Marco, Truma
- Éclairage : Narva, Ring, Hella, LED Autolamps, Osram, Rigid Industries
- Système : Victron Energy, Renogy, Mastervolt, Studer, Votronic, CTEK, Büttner

MARCHÉ CAMPING-CAR (contexte des équipements typiques) :
- Haut de gamme : Hymer, Carthago, Niesmann & Bischoff, Frankia, EuraMobil, Mobilvetta
- Milieu de gamme : Bailey, Elddis, AutoSleeper, Dethleffs, Bürstner, Pilote, Chausson
- Entrée de gamme : Adria, Carado, Sunlight, Swift, Benimar, Laika, Jayco, Avida

RÈGLES STRICTES :
- Ne propose que des produits RÉELS et identifiables (marque + modèle précis).
- watts = consommation électrique MOYENNE 12V réaliste (pas le pic).
  Frigos à compresseur : moyenne avec cycle ~30% (ex. 12V 75L ≈ 55W moyens).
  Chauffages à combustible (diesel/gaz) : UNIQUEMENT l'électrique (ventilateur + pompe + électronique).
- hours = nombre d'heures d'utilisation typique par jour.
- Reste STRICTEMENT dans la catégorie demandée.
- Utilise search_existing pour vérifier l'existant avant de proposer.
- Propose des équipements variés : entrée de gamme, milieu, haut de gamme.`

const TOOLS = [
  {
    name: 'search_existing',
    description: 'Recherche les équipements déjà présents dans le catalogue par mot-clé pour éviter les doublons.',
    input_schema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: 'Mot-clé : marque, type d\'équipement, modèle…' },
      },
      required: ['keyword'],
    },
  },
  {
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
              name:    { type: 'string', description: 'Nom complet : type + capacité + (Marque Modèle)' },
              brand:   { type: 'string', description: 'Marque' },
              watts:   { type: 'number', description: 'Consommation électrique moyenne 12V en watts' },
              hours:   { type: 'number', description: 'Heures d\'utilisation typiques par jour' },
              voltage: { type: 'number', description: '12 ou 24' },
            },
            required: ['name', 'brand', 'watts', 'hours'],
          },
        },
      },
      required: ['items'],
    },
  },
]

const CATEGORIES = ['Cuisine', 'Confort', 'Tech', 'Eau', 'Éclairage', 'Système']

async function searchExisting(keyword, category) {
  const url = `${SB_URL}/rest/v1/equipment_catalog?select=name,brand&or=(name.ilike.*${encodeURIComponent(keyword)}*,brand.ilike.*${encodeURIComponent(keyword)}*)&category=eq.${encodeURIComponent(category)}&limit=20`
  const res = await fetch(url, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } })
  if (!res.ok) return []
  return (await res.json()).map(r => `${r.name} (${r.brand || '—'})`)
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: CORS })

  let body
  try { body = await req.json() } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: CORS }) }

  const category = CATEGORIES.includes(body?.category) ? body.category : 'Cuisine'
  const query    = (body?.query || '').trim()
  const count    = Math.min(Math.max(parseInt(body?.count) || 12, 1), 25)

  const apiKey = process.env.ANTHROPIC_KEY || process.env.VITE_ANTHROPIC_KEY
  if (!apiKey) return new Response(JSON.stringify({ error: 'ANTHROPIC_KEY manquante' }), { status: 500, headers: CORS })

  try {
    const existRes = await fetch(
      `${SB_URL}/rest/v1/equipment_catalog?select=name&category=eq.${encodeURIComponent(category)}`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    )
    const existing      = existRes.ok ? await existRes.json() : []
    const existSet      = new Set(existing.map(r => (r.name || '').toLowerCase().trim()))
    const brandHints    = (EQUIPMENT_BRANDS[category] || []).join(', ')

    const userMsg = `Catégorie : "${category}".${query ? `\nFocus : ${query}.` : ''}
Objectif : proposer ${count} équipements NOUVEAUX et RÉELS pour cette catégorie.
Marques prioritaires : ${brandHints}.
Déjà ${existing.length} équipements en base pour cette catégorie.

Stratégie :
1. Utilise search_existing pour vérifier par marque ou type d'équipement ce qui est déjà présent.
2. Propose des équipements absents du catalogue, variés (entrée/milieu/haut de gamme).
3. Tu peux faire plusieurs appels search_existing et plusieurs appels propose_equipment.`

    // Boucle agentique
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
        return new Response(JSON.stringify({ error: 'Anthropic', detail: err }), { status: 502, headers: CORS })
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
              : 'Aucun résultat — ce type/marque n\'est pas encore dans le catalogue.',
          })
        } else if (tu.name === 'propose_equipment') {
          const items = tu.input.items || []
          allProposed.push(...items)
          const newCount = items.filter(it => !existSet.has((it.name || '').toLowerCase().trim())).length
          toolResults.push({
            type: 'tool_result',
            tool_use_id: tu.id,
            content: `${items.length} équipements reçus (${newCount} nouveaux). Total proposé : ${allProposed.length}/${count}. ${allProposed.length < count ? 'Continue pour atteindre l\'objectif.' : 'Objectif atteint.'}`,
          })
        }
      }

      messages.push({ role: 'user', content: toolResults })
      rounds++
    }

    // Dédup finale + marquage
    const seen = new Set()
    const enriched = []
    for (const it of allProposed) {
      const key = (it.name || '').toLowerCase().trim()
      if (!key || seen.has(key)) continue
      seen.add(key)
      enriched.push({
        name:      it.name,
        brand:     it.brand || '',
        watts:     Number(it.watts) || null,
        hours:     it.hours != null ? Number(it.hours) : 4,
        voltage:   Number(it.voltage) || 12,
        category,
        duplicate: existSet.has(key),
      })
    }

    return new Response(JSON.stringify({ ok: true, category, rounds, items: enriched }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: CORS })
  }
}
