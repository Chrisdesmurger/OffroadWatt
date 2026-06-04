export const config = { runtime: 'edge' }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const SYSTEM_PROMPT = `You are an expert in 12V mobile electrical systems for campervans and overlanding vehicles.

Your task: given an appliance name, calculate its realistic average daily energy consumption in a typical off-grid van context.

STEP 1 — Identify the appliance
- Determine the appliance category (compressor fridge, diesel heater, fan, etc.)
- Find its nominal peak power draw at 12V (in watts)
- Determine whether it runs continuously (24h/day) or intermittently

STEP 2 — Determine duty cycle
Duty cycle = percentage of time the device is actively drawing peak power.
- Compressor fridges: 25-35% at 20-25°C ambient (compressor cycles on/off to maintain temperature)
- Diesel/gas heaters: 30-60% of rated electrical draw, used 6-10h/day max
- Roof fans: used 4-8h/day, running near-continuously when on
- Intermittent devices (pump, microwave): short burst usage, express as hours/day
- Always-on devices (router, BMS, GPS): 100% duty cycle, 24h

STEP 3 — Calculate average watts
avg_watts = nominal_peak_watts × duty_cycle / 100

For combustion heaters (diesel, propane, gas): use ONLY the electrical draw of the fan + pump + ECU controller.
Do NOT use the thermal output (kW of heat). A 2kW diesel heater draws 10-30W electrically.

STEP 4 — Determine daily usage hours
- Always-on devices: 24h
- Seasonal devices (heater, AC): 6-10h typical daily use
- User-operated devices: realistic estimate based on category

STEP 5 — Validate
Verify that avg_watts × hours gives a plausible Ah/day when divided by 12.
A compressor fridge should be in the range of 15-40 Ah/day depending on size.
A diesel heater should be 5-20 Ah/day (electrical only).
If the result seems too high or too low, re-check the duty cycle assumption.`

const REFINE_TOOL = {
  name: 'return_consumption',
  description: 'Return structured realistic average energy consumption',
  input_schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Canonical appliance name — brand + model if known, else generic category',
      },
      nominal_watts: {
        type: 'number',
        description: 'Peak power draw of the device (watts)',
      },
      duty_cycle_pct: {
        type: 'number',
        description: 'Percentage of time the device draws peak power (0-100)',
      },
      avg_watts: {
        type: 'number',
        description: 'Average watts = nominal_watts × duty_cycle_pct / 100',
      },
      hours: {
        type: 'number',
        description: 'Realistic daily usage hours',
      },
      note: {
        type: 'string',
        description: 'One sentence explaining the duty cycle assumption',
      },
    },
    required: ['name', 'nominal_watts', 'duty_cycle_pct', 'avg_watts', 'hours', 'note'],
  },
}

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

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      temperature: 0,
      system: SYSTEM_PROMPT,
      tools: [REFINE_TOOL],
      tool_choice: { type: 'tool', name: 'return_consumption' },
      messages: [{
        role: 'user',
        content: `Appliance: "${name}"`,
      }],
    }),
  })

  if (!resp.ok) {
    const err = await resp.text()
    return new Response(`Anthropic error: ${err}`, { status: 502, headers: CORS })
  }

  const data = await resp.json()
  const result = data?.content?.find(b => b.type === 'tool_use')?.input
  if (!result) return new Response('No result from AI', { status: 502, headers: CORS })

  return new Response(JSON.stringify(result), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
