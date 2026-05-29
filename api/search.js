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
Tu effectues des recherches sur le web pour trouver des produits réels disponibles sur le marché européen.

RÈGLES STRICTES :
- Concentre-toi sur la consommation électrique 12V (ou 24V si spécifié)
- Si un équipement a plusieurs modes (ex: chauffage diesel ventilateur min/max, réfrigérateur 12V vs gaz), liste chaque mode dans "modes"
- Pour les appareils mixtes (gaz + 12V), watts = uniquement la partie électrique 12V

Retourne UNIQUEMENT ce JSON valide, sans markdown, sans texte autour :
{"results":[{"name":"Nom complet","brand":"Marque","voltage":12,"price_eur":299,"description":"1-2 phrases","type":"chauffage|réfrigérateur|éclairage|pompe|...","efficiency":"classe si dispo","modes":[{"label":"Mode X","watts":40},{"label":"Mode Y","watts":80}]}]}
Si un seul mode, "modes" contient un seul objet. Retourne 3 à 5 produits réels.`

  try {
    let messages = [{ role: 'user', content: `Recherche d'équipements 12V camping-car/van : ${query}` }]
    let finalText = null

    for (let turn = 0; turn < 8; turn++) {
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
        const err = await response.json().catch(() => ({ error: { message: `HTTP ${response.status}` } }))
        return res.status(response.status).json({ error: err.error?.message || `Anthropic API error ${response.status}` })
      }

      const data = await response.json()

      // Grab any text block present in this turn
      const textBlock = data.content?.find(b => b.type === 'text')

      if (data.stop_reason === 'end_turn') {
        if (textBlock) { finalText = textBlock.text; break }
      }

      if (data.stop_reason === 'tool_use') {
        // Add assistant turn then send tool results so Claude can continue
        messages.push({ role: 'assistant', content: data.content })
        const toolResults = (data.content || [])
          .filter(b => b.type === 'tool_use')
          .map(b => ({
            type: 'tool_result',
            tool_use_id: b.id,
            content: typeof b.output === 'string' ? b.output : (b.output ? JSON.stringify(b.output) : ''),
          }))
        if (toolResults.length > 0) {
          messages.push({ role: 'user', content: toolResults })
          continue
        }
        // No tool results to send — grab whatever text we have
        if (textBlock) { finalText = textBlock.text; break }
        break
      }

      // Any other stop reason — grab text if present
      if (textBlock) { finalText = textBlock.text; break }
      break
    }

    if (!finalText) {
      return res.status(500).json({ error: 'Aucune réponse textuelle de l\'IA après la recherche web.' })
    }

    // Extract JSON — handle markdown fences and surrounding prose
    const cleaned = finalText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim()

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Réponse IA non parsable en JSON.', raw: finalText.slice(0, 600) })
    }

    let parsed
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch (parseErr) {
      return res.status(500).json({ error: 'JSON invalide dans la réponse IA.', raw: jsonMatch[0].slice(0, 600) })
    }

    return res.json(parsed)
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Erreur interne du serveur' })
  }
}
