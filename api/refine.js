export const config = { runtime: 'edge' }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// ── Step 1: Web search agent — finds real consumption data online ─────────────
const SEARCH_PROMPT = `You are a research agent for 12V mobile electrical systems (campervans, overlanding).

Your task: search the internet for REAL consumption data for the given appliance.

Search strategy:
1. Search for the exact brand + model + "12V power consumption" OR "amperage" OR "Ah/day"
2. Look for: official spec sheets, YouTube campervan reviews, forum threads (sprinter-source, expeditionportal, vanlifeforums), manufacturer PDFs
3. If the model is generic, search for the most popular variant of that category
4. Extract: nominal watts, measured average consumption, duty cycle observations from real users
5. Note if it's 12V direct or via inverter

Prioritize real-world measurements over theoretical specs.
Summarize all consumption-relevant data found: watts nominal, amps at 12V, Ah/day measurements, duty cycle percentages, ambient temperature conditions mentioned.`

// ── Step 2: Structure findings into consumption schema ────────────────────────
const STRUCTURE_PROMPT = `You are an expert in 12V mobile power systems for campervans.

Your task: given search results about an appliance's electrical consumption, extract and structure the REALISTIC daily energy consumption for van/campervan off-grid use.

CALCULATION RULES:
- average_watts = nominal_watts × duty_cycle_pct / 100
- For combustion heaters: use ONLY electrical draw (fan, pump, ECU), NOT thermal output kW
- Ah/day = average_watts × hours / 12 (or use 24V if specified)
- "low" scenario = mild weather (15-20°C), minimal use
- "high" scenario = hot weather (30°C+) OR intensive daily use
- If the search found Ah/day directly: back-calculate watts = Ah × 12 / hours
- If no data found: use conservative estimates based on the appliance category

Be transparent about data quality: label whether values come from manufacturer specs, real-world measurements, or estimates.`

const STRUCTURE_TOOL = {
  name: 'return_consumption',
  description: 'Return structured realistic energy consumption data',
  input_schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Canonical appliance name — brand + model if found, else generic',
      },
      low: {
        type: 'object',
        description: 'Low scenario: mild weather / minimal use / winter',
        properties: {
          watts: { type: 'number', description: 'Average watts including duty cycle' },
          hours: { type: 'number', description: 'Realistic daily usage hours' },
          label: { type: 'string', description: 'Short label e.g. "Winter (15°C)" or "Light use"' },
        },
        required: ['watts', 'hours', 'label'],
      },
      high: {
        type: 'object',
        description: 'High scenario: hot weather / intensive use / summer',
        properties: {
          watts: { type: 'number', description: 'Average watts including duty cycle' },
          hours: { type: 'number', description: 'Realistic daily usage hours' },
          label: { type: 'string', description: 'Short label e.g. "Summer (30°C)" or "Intensive use"' },
        },
        required: ['watts', 'hours', 'label'],
      },
      note: {
        type: 'string',
        description: 'Key driver of the low/high difference (duty cycle, ambient temp, usage hours)',
      },
      data_source: {
        type: 'string',
        enum: ['manufacturer_spec', 'real_world_measurement', 'forum_data', 'estimate'],
        description: 'Best quality data source found during web search',
      },
      sources_found: {
        type: 'array',
        items: { type: 'string' },
        description: 'Brief list of sources consulted (e.g. "Dometic spec PDF", "sprinter-source forum thread")',
      },
    },
    required: ['name', 'low', 'high', 'note', 'data_source'],
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

  // ── Agent step 1: Web search for real consumption data ──────────────────────
  let searchFindings = ''
  let searchSources = []

  try {
    const step1Resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        ...baseHeaders,
        'anthropic-beta': 'web-search-2025-03-05',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        temperature: 0,
        system: SEARCH_PROMPT,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Find real 12V electrical consumption data for: "${name}". I need kWh/day, Ah/day, or average watts at 12V from real-world measurements.`,
        }],
      }),
    })

    if (step1Resp.ok) {
      const step1Data = await step1Resp.json()

      // Extract text findings from the response
      searchFindings = (step1Data.content || [])
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('\n')
        .trim()

      // Collect any URLs mentioned in tool results
      searchSources = (step1Data.content || [])
        .filter(b => b.type === 'tool_result')
        .flatMap(b => (b.content || []).filter(c => c.url).map(c => c.url))
        .slice(0, 5)
    }
  } catch (e) {
    // Web search failed — step 2 will fall back to estimation
    searchFindings = `Web search unavailable. Use expert estimation for: ${name}`
  }

  if (!searchFindings) {
    searchFindings = `No web data found for "${name}". Use conservative expert estimates based on appliance category.`
  }

  // ── Agent step 2: Structure findings into consumption schema ─────────────────
  const step2Resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: baseHeaders,
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      temperature: 0,
      system: STRUCTURE_PROMPT,
      tools: [STRUCTURE_TOOL],
      tool_choice: { type: 'tool', name: 'return_consumption' },
      messages: [{
        role: 'user',
        content: `Appliance: "${name}"\n\nWeb search findings:\n${searchFindings}`,
      }],
    }),
  })

  if (!step2Resp.ok) {
    const err = await step2Resp.text()
    return new Response(`Anthropic error (step 2): ${err}`, { status: 502, headers: CORS })
  }

  const step2Data = await step2Resp.json()
  const result = step2Data?.content?.find(b => b.type === 'tool_use')?.input
  if (!result) return new Response('No result from step 2', { status: 502, headers: CORS })

  // Include debug info visible in devtools for comparison
  const response = {
    ...result,
    sources_found: result.sources_found?.length ? result.sources_found : searchSources,
    _agent: {
      web_findings_length: searchFindings.length,
      web_search_used: !searchFindings.startsWith('Web search unavailable'),
      data_source: result.data_source,
    },
  }

  return new Response(JSON.stringify(response), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
