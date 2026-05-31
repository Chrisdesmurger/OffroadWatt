export const config = { runtime: 'edge' }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// ── Method 2: Detailed methodology + reference anchors ────────────────────────
const SYSTEM_PROMPT = `You are an expert electrical engineer specialized in 12V mobile power systems for campervans, caravans and overlanding vehicles.

Your task: given an appliance name, return its REALISTIC daily energy consumption for mobile/off-grid use.

METHODOLOGY — follow strictly in this order:
1. Identify the appliance technology and nominal power from manufacturer specs or well-known benchmarks
2. Apply real-world duty cycles to compute AVERAGE watts:
   - Compressor fridges: 30% duty cycle at 20°C ambient → "low"; 50% at 30°C → "high"
   - Diesel/gas heaters (Webasto, Eberspächer, Truma): watts = fan+pump+electronics ONLY, NOT thermal output
   - Inverter-connected appliances (microwave, kettle, induction): add 10% inverter losses
   - LED lighting: use actual LED chip wattage, not equivalent incandescent
   - Laptops/tablets: measured consumption during use (not TDP), including screen brightness
   - Always-on devices (router, BMS, GPS): realistic idle/active draw
3. "low" = mild weather + minimal daily use + efficient operation
4. "high" = hot weather OR intensive daily use + worst-case realistic

REFERENCE ANCHORS — calibrate your answer against these real-world measurements:
| Appliance                               | Low W | Low h | High W | High h |
|-----------------------------------------|-------|-------|--------|--------|
| 12V compressor fridge 50L               |  15   |  24   |  28    |  24    |
| 12V compressor fridge 70-80L            |  18   |  24   |  33    |  24    |
| 12V portable freezer                    |  20   |  24   |  36    |  24    |
| Diesel heater 2kW (Webasto/Eberspächer) |   8   |   5   |  35    |  10    |
| Gas+electric heater (Truma Combi)       |   8   |   6   |  25    |  12    |
| 12V fan (ventilation)                   |   8   |   6   |  25    |  10    |
| Laptop 13-15" (MacBook/ThinkPad)        |  30   |   3   |  60    |   6    |
| Smartphone charge ×2                    |   5   |   2   |  10    |   3    |
| LED strip 5m (12V)                      |  10   |   3   |  15    |   6    |
| LED spots ×4                            |  15   |   3   |  20    |   5    |
| 4G/WiFi router                          |   6   |  24   |  10    |  24    |
| 12V water pump                          |  40   |  0.3  |  60    |  0.5   |
| TV 24" LED                              |  30   |   2   |  45    |   4    |
| MPPT regulator (quiescent draw)         |   3   |  24   |   6    |  24    |

CRITICAL RULES:
- "watts" = AVERAGE watts INCLUDING duty cycle — NEVER peak or nominal watts
- For combustion heaters: watts = electrical draw ONLY (fan, pump, ignition electronics), not kW thermal
- Never return 0W for an active appliance
- "hours" = realistic daily usage hours, not maximum possible
- Anchor to the reference table above when the appliance is similar`

// ── Method 4: Strict tool schema — no text parsing, no regex ─────────────────
const REFINE_TOOL = {
  name: 'return_consumption',
  description: 'Return the realistic energy consumption data for the appliance in mobile off-grid use',
  input_schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Canonical appliance name — brand + model if identifiable, else generic name',
      },
      technology: {
        type: 'string',
        description: 'Technology category e.g. "compressor fridge", "diesel heater", "LED strip", "laptop"',
      },
      low: {
        type: 'object',
        description: 'Low consumption scenario: mild weather / minimal use / winter',
        properties: {
          watts: { type: 'number', description: 'Average watts including duty cycle — realistic, not peak' },
          hours: { type: 'number', description: 'Realistic daily usage hours' },
          label: { type: 'string', description: 'Short label e.g. "Winter (15°C)" or "Light use"' },
        },
        required: ['watts', 'hours', 'label'],
      },
      high: {
        type: 'object',
        description: 'High consumption scenario: hot weather / intensive use / summer',
        properties: {
          watts: { type: 'number', description: 'Average watts including duty cycle — realistic, not peak' },
          hours: { type: 'number', description: 'Realistic daily usage hours' },
          label: { type: 'string', description: 'Short label e.g. "Summer (30°C)" or "Intensive use"' },
        },
        required: ['watts', 'hours', 'label'],
      },
      note: {
        type: 'string',
        description: 'One sentence explaining the main driver of difference between low and high (duty cycle, ambient temp, usage hours…)',
      },
    },
    required: ['name', 'low', 'high', 'note'],
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

  const anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      temperature: 0,                                              // Method 1: deterministic
      system: SYSTEM_PROMPT,                                       // Method 2: methodology + anchors
      tools: [REFINE_TOOL],                                        // Method 4: structured schema
      tool_choice: { type: 'tool', name: 'return_consumption' },  // force tool call
      messages: [{ role: 'user', content: `Appliance: ${name}` }],
    }),
  })

  if (!anthropicResp.ok) {
    const err = await anthropicResp.text()
    return new Response(`Anthropic error: ${err}`, { status: 502, headers: CORS })
  }

  const data = await anthropicResp.json()

  // Method 4: extract from tool_use block — zero text parsing needed
  const toolUse = data?.content?.find(b => b.type === 'tool_use')
  if (!toolUse?.input) return new Response('No tool result in response', { status: 502, headers: CORS })

  return new Response(JSON.stringify(toolUse.input), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
