export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { query } = req.body || {}
  if (!query) return res.status(400).json({ error: 'Missing query' })

  const apiKey = process.env.ANTHROPIC_KEY || process.env.VITE_ANTHROPIC_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key not configured on server' })

  const system = `Tu es un expert en équipements électriques pour camping-car, van et caravane.
Tu effectues des recherches sur le web pour trouver des produits réels disponibles sur le marché européen.
Tu retournes UNIQUEMENT un objet JSON valide, sans markdown, sans explication, sans texte autour :
{"results":[{"name":"Nom complet du produit","brand":"Marque","watts":45,"voltage":12,"price_eur":299,"description":"1-2 phrases sur le produit et son utilisation","type":"catégorie (réfrigérateur|chauffage|éclairage|pompe|ventilateur|convertisseur|...)","efficiency":"classe énergétique si disponible"}]}
Retourne 3 à 5 produits réels avec la consommation électrique précise en watts. Prix en euros marché européen.`

  try {
    let messages = [{ role: 'user', content: `Recherche d'équipements camping-car/van : ${query}` }]
    let finalText = null

    for (let turn = 0; turn < 6; turn++) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 2048,
          system,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        return res.status(response.status).json({ error: err.error?.message || 'Anthropic API error' })
      }

      const data = await response.json()

      if (data.stop_reason === 'end_turn') {
        const textBlock = data.content?.find(b => b.type === 'text')
        if (textBlock) { finalText = textBlock.text; break }
      }

      if (data.stop_reason === 'tool_use') {
        messages.push({ role: 'assistant', content: data.content })
        const toolResults = (data.content || [])
          .filter(b => b.type === 'tool_use')
          .map(b => ({ type: 'tool_result', tool_use_id: b.id, content: b.output || '' }))
        if (toolResults.length > 0) {
          messages.push({ role: 'user', content: toolResults })
        } else {
          break
        }
        continue
      }

      // stop_reason: max_tokens or other — grab whatever text we have
      const textBlock = data.content?.find(b => b.type === 'text')
      if (textBlock) { finalText = textBlock.text; break }
      break
    }

    if (!finalText) return res.status(500).json({ error: 'No usable response from AI' })

    // Extract JSON from response (handle cases where model wraps with prose)
    const jsonMatch = finalText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return res.status(500).json({ error: 'Could not parse AI response as JSON', raw: finalText.slice(0, 500) })

    const parsed = JSON.parse(jsonMatch[0])
    return res.json(parsed)
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
