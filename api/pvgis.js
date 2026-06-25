export const config = { runtime: 'edge' }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })

  const url = new URL(req.url)
  const lat = parseFloat(url.searchParams.get('lat'))
  const lon = parseFloat(url.searchParams.get('lon'))

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return new Response(JSON.stringify({ error: 'Invalid coordinates' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } })
  }

  try {
    const pvgisUrl = `https://re.jrc.ec.europa.eu/api/v5_3/PVcalc?lat=${lat}&lon=${lon}&peakpower=1&loss=14&outputformat=json`
    const res = await fetch(pvgisUrl, {
      headers: {
        'User-Agent': 'OffroadWatt/1.0 (solar calculator; +https://offroadwatt.com)',
        'Accept': 'application/json',
      },
    })
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `PVGIS returned ${res.status}` }), { status: 502, headers: { ...CORS, 'Content-Type': 'application/json' } })
    }
    const data = await res.json()
    return new Response(JSON.stringify(data), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'PVGIS unreachable' }), { status: 502, headers: { ...CORS, 'Content-Type': 'application/json' } })
  }
}
