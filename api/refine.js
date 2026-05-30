export const config = { runtime: 'edge' }

const SYSTEM_PROMPT = `You are an expert in 12V electrical systems for campervans, caravans and vans (vanlife/overlanding).
Your task: given an appliance name, return its REALISTIC daily energy consumption for mobile use.

CRITICAL RULES:
- "watts" = AVERAGE watts over 24h INCLUDING duty cycles (e.g. a fridge compressor runs ~40% of the time, so a 45W compressor = 18W average)
- For appliances used intermittently, "hours" = typical daily usage hours
- Return ONLY valid JSON, no markdown, no explanation
- Provide LOW (winter/minimal use) and HIGH (summer/intensive use) consumption scenarios

JSON FORMAT:
{
  "name": "canonical appliance name",
  "low": { "watts": X, "hours": H, "label": "short label (winter / minimal)" },
  "high": { "watts": X, "hours": H, "label": "short label (summer / intensive)" },
  "note": "1-line explanation of the difference"
}

Examples:
- 12V compressor fridge: low={watts:15,hours:24,label:"Hiver (15°C)"}, high={watts:28,hours:24,label:"Été (30°C)"}
- Diesel heater: low={watts:35,hours:4,label:"Nuit fraîche"}, high={watts:40,hours:10,label:"Grand froid"}
- Laptop: low={watts:35,hours:3,label:"Usage léger"}, high={watts:55,hours:6,label:"Usage intensif"}`

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  let name
  try {
    const body = await req.json()
    name = (body.name || '').trim()
  } catch {
    return new Response('Bad request', { status: 400 })
  }

  if (!name) return new Response('Missing name', { status: 400 })

  const key = process.env.ANTHROPIC_KEY
  if (!key) return new Response('Missing ANTHROPIC_KEY', { status: 500 })

  const anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Appliance: ${name}` }],
    }),
  })

  if (!anthropicResp.ok) {
    const err = await anthropicResp.text()
    return new Response(`Anthropic error: ${err}`, { status: 502 })
  }

  const data = await anthropicResp.json()
  const text = data?.content?.[0]?.text || ''

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return new Response('No JSON in response', { status: 502 })

  return new Response(jsonMatch[0], {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}
