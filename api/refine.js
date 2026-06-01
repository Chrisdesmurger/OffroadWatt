export const config = { runtime: 'edge' }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const SYSTEM_PROMPT = `You are an expert in 12V mobile electrical systems for campervans, motorhomes and overlanding vehicles.

Your task: return the REALISTIC average daily energy consumption for the given appliance in a typical van/campervan off-grid context.

METHODOLOGY:
1. Identify the appliance category and its typical operating characteristics
2. Use the duty cycle (% of time the device is actually drawing power) to compute average watts
3. For combustion heaters (diesel, gas): use ONLY the electrical draw (fan, pump, ECU) — NOT the thermal output
4. For compressor fridges: duty cycle depends on ambient temperature and thermal insulation quality; use a realistic 35-40% average for a typical mixed-use day at 20-25°C ambient
5. For intermittent devices (water pump, microwave): use realistic daily usage duration in hours
6. avg_watts = nominal_peak_watts × duty_cycle_pct / 100

CALIBRATED REFERENCE VALUES — your output MUST match these for similar appliances:
| Appliance                                       | avg_watts | hours | Ah/day (÷12) |
|-------------------------------------------------|-----------|-------|--------------|
| Compressor fridge 40-50L 12V (e.g. Dometic CFX3 45) | 18   | 24    | 36 Ah        |
| Compressor fridge 60-80L 12V (e.g. ARB 63L)    | 22        | 24    | 44 Ah        |
| Dometic CFX3 45 specifically                    | 18        | 24    | 36 Ah        |
| Dometic CFX3 55                                 | 20        | 24    | 40 Ah        |
| ARB Elements 63L specifically                   | 22        | 24    | 44 Ah        |
| Vitrifrigo C42i specifically                    | 14        | 24    | 28 Ah        |
| Vitrifrigo C51i                                 | 16        | 24    | 32 Ah        |
| Isotherm Cruise 65                              | 18        | 24    | 36 Ah        |
| Diesel heater 2kW (Webasto Air Top 2000 STC)    | 15        | 8     | 10 Ah        |
| Diesel heater 4kW (Webasto Air Top 4000 STC)    | 22        | 8     | 15 Ah        |
| Gas+electric combo heater (Truma Combi 4)       | 8         | 8     | 5 Ah         |
| Diesel heater 2kW (Espar/Eberspächer Airtronic) | 12        | 8     | 8 Ah         |
| 12V roof fan (Maxxair, Fantastic Vent)          | 25        | 6     | 12 Ah        |
| 12V portable AC (EcoFlow Wave 2)                | 330       | 4     | 110 Ah       |
| LED strip 5m                                    | 12        | 5     | 5 Ah         |
| Laptop / MacBook                                | 45        | 4     | 15 Ah        |
| 4G router (GL.iNet, Teltonika)                  | 8         | 24    | 16 Ah        |
| Water pump 12V                                  | 50        | 0.5   | 2 Ah         |

OUTPUT RULES:
- avg_watts = AVERAGE watts including duty cycle (NOT peak watts)
- hours = realistic daily usage hours
- Resulting Ah/day = avg_watts × hours / 12 MUST match known real-world measurements exactly
- Do NOT overestimate — use the calibrated table above as ground truth
- If the exact model is in the table above, use those exact values
- note: one short sentence on duty cycle / assumption used`

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
      avg_watts: {
        type: 'number',
        description: 'Average watts including duty cycle',
      },
      hours: {
        type: 'number',
        description: 'Realistic daily usage hours (24 for always-on like fridges, less for intermittent)',
      },
      note: {
        type: 'string',
        description: 'Short explanation: duty cycle assumed and key assumption',
      },
    },
    required: ['name', 'avg_watts', 'hours', 'note'],
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
