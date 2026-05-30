export const config = { runtime: 'edge' }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const SYSTEM_PROMPT = `You are an expert in 12V electrical systems for campervans, caravans and vans (vanlife/overlanding).
Your task: given an appliance name, return its REALISTIC daily energy consumption for mobile use.

CRITICAL RULES:
- "watts" = AVERAGE watts including duty cycles (e.g. a 45W compressor fridge running 40% of the time = 18W average)
- For combustion heaters (diesel/gas): watts = electrical draw of fan/pump/electronics ONLY, not thermal power
- For intermittent appliances: "hours" = typical daily usage hours
- Return ONLY valid JSON, no markdown, no explanation outside the JSON

JSON FORMAT:
{
  "name": "canonical appliance name",
  "low": { "watts": X, "hours": H, "label": "short label (e.g. Winter / Minimal)" },
  "high": { "watts": X, "hours": H, "label": "short label (e.g. Summer / Intensive)" },
  "note": "1-line explanation of the difference between low and high"
}

Examples:
- 12V compressor fridge 45W peak: low={watts:15,hours:24,label:"Winter (15°C)"}, high={watts:28,hours:24,label:"Summer (30°C)"}
- Diesel heater Webasto: low={watts:30,hours:5,label:"Mild night"}, high={watts:40,hours:10,label:"Deep cold"}
- Laptop MacBook: low={watts:35,hours:3,label:"Light use"}, high={watts:55,hours:6,label:"Intensive use"}`

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS })

  let name
  try {
    const body = await req.json()
    name = (body.name || '').trim()
  } catch {
    return new Response('Bad request', { status: 400, headers: CORS })
  }

  if (!name) return new Response('Missing name', { status: 400, headers: CORS })

  const apiKey = process.env.ANTHROPIC_KEY || process.env.VITE_ANTHROPIC_KEY
  if (!apiKey) return new Response('Missing API key', { status: 500, headers: CORS })

  const anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
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
    return new Response(`Anthropic error: ${err}`, { status: 502, headers: CORS })
  }

  const data = await anthropicResp.json()
  const text = data?.content?.[0]?.text || ''

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return new Response('No JSON in response', { status: 502, headers: CORS })

  return new Response(jsonMatch[0], {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
