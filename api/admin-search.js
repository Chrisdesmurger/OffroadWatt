// Serverless Node.js — maxDuration: 60s dans vercel.json

const SB_URL = process.env.SUPABASE_URL || 'https://ofjpskrjlwfebaqomijm.supabase.co'
const SB_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9manBza3JqbHdmZWJhcW9taWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwODIzMTMsImV4cCI6MjA5NTY1ODMxM30.R2hqPwmvihdgVv7rwLp0r--Jo0Qp6m6ORc-PU4M58n8'

const CATEGORIES = [
  'Réfrigérateur', 'Micro-onde', 'Four', 'Chauffe-eau', 'Chauffage',
  'Chargeur solaire', 'Chargeur DC-DC', 'Onduleur',
  'Télévision', 'Satellite', 'Box internet',
  'Pompe à eau', 'Chargeur batterie',
]

const EQUIPMENT_BRANDS = {
  'Réfrigérateur':    ['Dometic', 'Waeco', 'Engel', 'ARB', 'National Luna', 'Iceco', 'Alpicool', 'Brass Monkey'],
  'Micro-onde':       ['Dometic', 'Severin', 'Russell Hobbs', 'Midea', 'Toshiba', 'Whirlpool'],
  'Four':             ['Dometic', 'Omnia', 'Coleman', 'Truma', 'Enders'],
  'Chauffe-eau':      ['Truma', 'Webasto', 'Whale', 'Alde', 'Morco', 'Elgas'],
  'Chauffage':        ['Webasto', 'Eberspächer', 'Espar', 'Truma', 'Propex', 'Planar', 'Autoterm'],
  'Chargeur solaire': ['Victron Energy', 'Renogy', 'Epever', 'SRNE', 'Votronic', 'Büttner'],
  'Chargeur DC-DC':   ['Victron Energy', 'Renogy', 'Sterling', 'Votronic', 'Redarc', 'CTEK', 'Ring'],
  'Onduleur':         ['Victron Energy', 'Renogy', 'Sterling', 'Studer', 'Mastervolt', 'Ring'],
  'Télévision':       ['Avtex', 'Oyster', 'Winegard', 'Camos', 'Dometic', 'Roadtrip'],
  'Satellite':        ['Oyster', 'Maxview', 'Satgear', 'Megasat', 'Teleco', 'Selfsat'],
  'Box internet':     ['Huawei', 'ZTE', 'Netgear', 'GL.iNet', 'Pepwave', 'Zyxel', 'TP-Link'],
  'Pompe à eau':      ['Seaflo', 'Shurflo', 'Whale', 'Jabsco', 'Flojet', 'Marco'],
  'Chargeur batterie':['CTEK', 'Sterling', 'Votronic', 'Victron Energy', 'Büttner', 'Ring', 'Noco'],
}

const SYSTEM = [{
  type: 'text',
  cache_control: { type: 'ephemeral' },
  text: `Tu es un expert en équipements électriques 12V/24V pour camping-car, van et caravane.
Tu connais précisément les modèles réels et leur consommation électrique moyenne réaliste en usage off-grid.

MARQUES D'ÉQUIPEMENTS PRIORITAIRES PAR CATÉGORIE :
- Réfrigérateur : Dometic, Waeco, Engel, ARB, National Luna, Iceco, Alpicool
- Micro-onde : Dometic, Severin, Russell Hobbs, Midea, Toshiba
- Four : Dometic, Omnia, Coleman, Truma, Enders
- Chauffe-eau : Truma, Webasto, Whale, Alde, Morco
- Chauffage : Webasto, Eberspächer/Espar, Truma, Propex, Planar, Autoterm
- Chargeur solaire : Victron Energy, Renogy, Epever, SRNE, Votronic, Büttner
- Chargeur DC-DC : Victron Energy, Renogy, Sterling, Votronic, Redarc, CTEK
- Onduleur : Victron Energy, Renogy, Sterling, Studer, Mastervolt
- Télévision : Avtex, Oyster, Winegard, Camos, Dometic, Roadtrip
- Satellite : Oyster, Maxview, Satgear, Megasat, Teleco, Selfsat
- Box internet : Huawei, ZTE, Netgear, GL.iNet, Pepwave, TP-Link
- Pompe à eau : Seaflo, Shurflo, Whale, Jabsco, Flojet, Marco
- Chargeur batterie : CTEK, Sterling, Votronic, Victron Energy, Büttner, Noco

MARCHÉ CAMPING-CAR :
- Haut de gamme : Hymer, Carthago, Niesmann & Bischoff, Frankia, EuraMobil, Mobilvetta
- Milieu de gamme : Bailey, Elddis, AutoSleeper, Dethleffs, Bürstner, Pilote, Chausson
- Entrée de gamme : Adria, Carado, Sunlight, Swift, Benimar, Laika, Jayco, Avida, Nebula

RÈGLES STRICTES :
- Ne propose que des produits RÉELS et identifiables (marque + modèle précis).
- watts = consommation électrique MOYENNE 12V réaliste (pas le pic).
  Réfrigérateurs à compresseur : moyenne avec cycle ~30% (ex. 12V 75L ≈ 55W moyens).
  Chauffages diesel/gaz : UNIQUEMENT l'électrique (ventilateur + pompe + électronique).
  Micro-onde/Four : watts de fonctionnement × usage moyen (ex. 800W micro-onde × 0.25h = 200Wh/j).
- hours = nombre d'heures d'utilisation typique par jour.
- Reste STRICTEMENT dans la catégorie demandée.
- Utilise search_existing avant de proposer pour éviter les doublons.
- Varie les gammes (entrée / milieu / haut de gamme).`,
}]

const TOOLS = [
  {
    name: 'search_existing',
    description: 'Recherche les équipements déjà présents dans le catalogue par mot-clé.',
    input_schema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: 'Marque, type ou modèle à vérifier' },
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
              brand:   { type: 'string' },
              watts:   { type: 'number' },
              hours:   { type: 'number' },
              voltage: { type: 'number', description: '12 ou 24' },
            },
            required: ['name', 'brand', 'watts', 'hours'],
          },
        },
      },
      required: ['items'],
    },
    cache_control: { type: 'ephemeral' },
  },
]

async function searchExisting(keyword, category) {
  const url = `${SB_URL}/rest/v1/equipment_catalog?select=name,brand&or=(name.ilike.*${encodeURIComponent(keyword)}*,brand.ilike.*${encodeURIComponent(keyword)}*)&category=eq.${encodeURIComponent(category)}&limit=20`
  const res = await fetch(url, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } })
  if (!res.ok) return []
  return (await res.json()).map(r => `${r.name} (${r.brand || '—'})`)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return }

  const body     = req.body || {}
  const category = CATEGORIES.includes(body.category) ? body.category : CATEGORIES[0]
  const query    = (body.query || '').trim()
  const count    = Math.min(Math.max(parseInt(body.count) || 12, 1), 25)

  const apiKey = process.env.ANTHROPIC_KEY || process.env.VITE_ANTHROPIC_KEY
  if (!apiKey) { res.status(500).json({ error: 'ANTHROPIC_KEY manquante' }); return }

  try {
    const existRes = await fetch(
      `${SB_URL}/rest/v1/equipment_catalog?select=name&category=eq.${encodeURIComponent(category)}`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    )
    const existing   = existRes.ok ? await existRes.json() : []
    const existSet   = new Set(existing.map(r => (r.name || '').toLowerCase().trim()))
    const brandHints = (EQUIPMENT_BRANDS[category] || []).join(', ')

    const userMsg = `Catégorie : "${category}".${query ? `\nFocus : ${query}.` : ''}
Objectif : proposer ${count} équipements NOUVEAUX et RÉELS pour cette catégorie.
Marques prioritaires : ${brandHints}.
Déjà ${existing.length} équipements en base.

Stratégie :
1. Utilise search_existing pour vérifier par marque ou type ce qui est déjà présent.
2. Propose des équipements absents, variés (entrée / milieu / haut de gamme).
3. Tu peux enchaîner plusieurs search_existing et propose_equipment.`

    const messages = [{ role: 'user', content: userMsg }]
    const allProposed = []
    let rounds = 0

    while (rounds < 3) {
      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'prompt-caching-2024-07-31',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 8096,
          system: SYSTEM,
          tools: TOOLS,
          tool_choice: { type: 'auto' },
          messages,
        }),
      })

      if (!aiRes.ok) {
        const err = await aiRes.text()
        res.status(502).json({ error: 'Anthropic', detail: err }); return
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
              : 'Aucun — cette marque/type n\'est pas encore dans le catalogue.',
          })
        } else if (tu.name === 'propose_equipment') {
          const items = tu.input.items || []
          allProposed.push(...items)
          const newCount = items.filter(it => !existSet.has((it.name || '').toLowerCase().trim())).length
          toolResults.push({
            type: 'tool_result',
            tool_use_id: tu.id,
            content: `${items.length} reçus (${newCount} nouveaux). Total : ${allProposed.length}/${count}. ${allProposed.length < count ? 'Continue.' : 'Objectif atteint.'}`,
          })
        }
      }

      messages.push({ role: 'user', content: toolResults })
      rounds++
    }

    const seen = new Set()
    const enriched = []
    for (const it of allProposed) {
      const key = (it.name || '').toLowerCase().trim()
      if (!key || seen.has(key)) continue
      seen.add(key)
      enriched.push({
        name: it.name, brand: it.brand || '',
        watts: Number(it.watts) || null,
        hours: it.hours != null ? Number(it.hours) : 4,
        voltage: Number(it.voltage) || 12,
        category,
        duplicate: existSet.has(key),
      })
    }

    res.status(200).json({ ok: true, category, rounds, items: enriched })
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) })
  }
}
