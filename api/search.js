module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { query } = req.body || {}
  if (!query) return res.status(400).json({ error: 'Missing query' })

  const apiKey = process.env.ANTHROPIC_KEY || process.env.VITE_ANTHROPIC_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key not configured on server' })

  const system = `Tu es un expert en équipements électriques 12V pour camping-car, van et caravane.
Tu connais précisément les consommations électriques des équipements des marques Webasto, Truma, Dometic, Waeco, Victron, Shurflo, Remis, Fiamma et autres marques européennes.

RÈGLES STRICTES :
- Donne la consommation électrique 12V précise en watts pour chaque mode
- Pour les chauffages à combustible (diesel/gaz Webasto, Truma, etc.) : watts = consommation électrique du ventilateur/pompe/électronique, PAS la puissance thermique
- Pour les appareils mixte (gaz + 12V) : précise la partie électrique uniquement
- Si plusieurs modes (veille, puissance min, max) : liste chaque mode dans "modes"
- Prix indicatifs marché européen en euros

Retourne UNIQUEMENT ce JSON valide, sans markdown, sans texte autour :
{"results":[{"name":"Nom complet du produit","brand":"Marque","voltage":12,"price_eur":850,"description":"1-2 phrases sur le produit et son usage camping-car/van","type":"chauffage|réfrigérateur|éclairage|pompe|ventilateur|convertisseur|...","efficiency":"classe si dispo","modes":[{"label":"Veille / allumage","watts":10},{"label":"Puissance min","watts":30},{"label":"Puissance max","watts":80}]}]}
Si un seul mode, "modes" contient un seul objet. Retourne 3 à 5 produits réels.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system,
        messages: [{ role: 'user', content: `Recherche d'équipements 12V camping-car/van : ${query}` }],
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return res.status(response.status).json({ error: err.error?.message || `Erreur API Anthropic ${response.status}` })
    }

    const data = await response.json()
    const textBlock = data.content?.find(b => b.type === 'text')
    if (!textBlock) return res.status(500).json({ error: 'Aucune réponse textuelle de l\'IA.' })

    const cleaned = textBlock.text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return res.status(500).json({ error: 'Réponse IA non parsable.', raw: cleaned.slice(0, 400) })

    let parsed
    try { parsed = JSON.parse(jsonMatch[0]) }
    catch (e) { return res.status(500).json({ error: 'JSON invalide.', raw: jsonMatch[0].slice(0, 400) }) }

    return res.json(parsed)
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Erreur interne' })
  }
}
