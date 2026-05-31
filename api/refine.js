export const config = { runtime: 'edge' }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// ── Step 1: Identify the appliance specs ──────────────────────────────────────
const IDENTIFY_PROMPT = `You are a hardware specifications expert for 12V mobile and off-grid electrical systems.

Your task: given an appliance name, identify its TECHNICAL SPECIFICATIONS that affect electrical consumption.

Focus on:
- The exact technology (compressor, absorption, resistance, LED, MOSFET, brushless motor…)
- Nominal electrical power draw from manufacturer data or well-known benchmarks
- Duty cycle behavior (continuous, cyclic, on-demand)
- Key environmental factors that affect consumption (ambient temperature, load, usage pattern)
- Whether the appliance has multiple electrical components (e.g. diesel heater = pump + fan + ECU)

Be precise and factual. Do not calculate consumption yet — only identify specs.`

const IDENTIFY_TOOL = {
  name: 'identify_specs',
  description: 'Identify the technical electrical specifications of the appliance',
  input_schema: {
    type: 'object',
    properties: {
      canonical_name: {
        type: 'string',
        description: 'Best canonical name: brand + model if identifiable, else category + size',
      },
      technology: {
        type: 'string',
        description: 'Core technology e.g. "variable-speed compressor", "catalytic diesel combustion", "OLED panel"',
      },
      nominal_watts: {
        type: 'number',
        description: 'Nominal electrical power from specs (peak/rated watts, not average)',
      },
      duty_cycle_type: {
        type: 'string',
        enum: ['continuous', 'cyclic', 'on-demand', 'standby+burst'],
        description: 'How the appliance draws power over time',
      },
      duty_cycle_low_pct: {
        type: 'number',
        description: 'Estimated duty cycle % in mild/low-use conditions (0-100)',
      },
      duty_cycle_high_pct: {
        type: 'number',
        description: 'Estimated duty cycle % in hot/intensive conditions (0-100)',
      },
      key_consumption_factors: {
        type: 'array',
        items: { type: 'string' },
        description: 'Top 2-3 factors that most affect real-world consumption (e.g. ambient temp, insulation, load)',
      },
      electrical_components: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of electrical sub-components if multiple (e.g. ["compressor motor 45W", "fan 3W", "thermostat 1W"])',
      },
    },
    required: ['canonical_name', 'technology', 'nominal_watts', 'duty_cycle_type', 'duty_cycle_low_pct', 'duty_cycle_high_pct', 'key_consumption_factors'],
  },
}

// ── Step 2: Compute consumption from identified specs ─────────────────────────
const COMPUTE_PROMPT = `You are an expert in energy consumption calculation for 12V mobile power systems.

Your task: given the technical specifications of an appliance, compute its REALISTIC daily energy consumption for van/campervan off-grid use.

CALCULATION RULES:
- average_watts = nominal_watts × (duty_cycle_pct / 100)
- For combustion heaters: use ONLY the electrical components (fan, pump, ECU) — ignore thermal output
- For inverter-connected loads: multiply watts by 1.10 for inverter losses
- "low" scenario = mild conditions (15-20°C ambient, minimal usage)
- "high" scenario = demanding conditions (30°C+ ambient OR intensive daily use)
- Report AVERAGE watts, not peak/nominal watts
- Report realistic daily usage hours (not "could run 24h" — what a real user actually uses)`

const COMPUTE_TOOL = {
  name: 'return_consumption',
  description: 'Return the final realistic energy consumption based on the identified specs',
  input_schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Canonical appliance name',
      },
      low: {
        type: 'object',
        description: 'Low consumption scenario: mild weather / minimal use / winter',
        properties: {
          watts: { type: 'number', description: 'Average watts including duty cycle' },
          hours: { type: 'number', description: 'Realistic daily usage hours' },
          label: { type: 'string', description: 'Short label e.g. "Winter (15°C)" or "Light use"' },
        },
        required: ['watts', 'hours', 'label'],
      },
      high: {
        type: 'object',
        description: 'High consumption scenario: hot weather / intensive use / summer',
        properties: {
          watts: { type: 'number', description: 'Average watts including duty cycle' },
          hours: { type: 'number', description: 'Realistic daily usage hours' },
          label: { type: 'string', description: 'Short label e.g. "Summer (30°C)" or "Intensive use"' },
        },
        required: ['watts', 'hours', 'label'],
      },
      note: {
        type: 'string',
        description: 'One sentence explaining the key driver of difference: duty cycle % change, usage hours, or ambient temperature effect',
      },
      calculation_basis: {
        type: 'string',
        description: 'Brief explanation of the calculation: e.g. "45W nominal × 30% duty cycle at 20°C = 13.5W avg"',
      },
    },
    required: ['name', 'low', 'high', 'note', 'calculation_basis'],
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

  const baseHeaders = {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
  }

  // ── Agent step 1: Identify specs ────────────────────────────────────────────
  const step1Resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: baseHeaders,
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      temperature: 0,
      system: IDENTIFY_PROMPT,
      tools: [IDENTIFY_TOOL],
      tool_choice: { type: 'tool', name: 'identify_specs' },
      messages: [{ role: 'user', content: `Appliance: ${name}` }],
    }),
  })

  if (!step1Resp.ok) {
    const err = await step1Resp.text()
    return new Response(`Anthropic error (step 1): ${err}`, { status: 502, headers: CORS })
  }

  const step1Data = await step1Resp.json()
  const specs = step1Data?.content?.find(b => b.type === 'tool_use')?.input
  if (!specs) return new Response('No specs from step 1', { status: 502, headers: CORS })

  // ── Agent step 2: Compute consumption from identified specs ─────────────────
  const specsContext = `
Appliance: ${specs.canonical_name}
Technology: ${specs.technology}
Nominal electrical power: ${specs.nominal_watts}W
Duty cycle type: ${specs.duty_cycle_type}
Duty cycle — low conditions: ${specs.duty_cycle_low_pct}%
Duty cycle — high conditions: ${specs.duty_cycle_high_pct}%
Key consumption factors: ${(specs.key_consumption_factors || []).join(', ')}
${specs.electrical_components?.length ? `Electrical sub-components: ${specs.electrical_components.join(', ')}` : ''}
  `.trim()

  const step2Resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: baseHeaders,
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      temperature: 0,
      system: COMPUTE_PROMPT,
      tools: [COMPUTE_TOOL],
      tool_choice: { type: 'tool', name: 'return_consumption' },
      messages: [{ role: 'user', content: specsContext }],
    }),
  })

  if (!step2Resp.ok) {
    const err = await step2Resp.text()
    return new Response(`Anthropic error (step 2): ${err}`, { status: 502, headers: CORS })
  }

  const step2Data = await step2Resp.json()
  const result = step2Data?.content?.find(b => b.type === 'tool_use')?.input
  if (!result) return new Response('No result from step 2', { status: 502, headers: CORS })

  // Include specs debug info in response (visible in browser devtools)
  const response = {
    ...result,
    _agent: {
      specs_identified: specs,
      calculation_basis: result.calculation_basis,
    },
  }

  return new Response(JSON.stringify(response), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
