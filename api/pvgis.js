export const config = { runtime: 'nodejs', regions: ['cdg1'] }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(res, status, body) {
  res.writeHead(status, { ...CORS, 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS)
    return res.end()
  }

  const lat = parseFloat(req.query.lat)
  const lon = parseFloat(req.query.lon)

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return json(res, 400, { error: 'Invalid coordinates' })
  }

  try {
    const pvgisUrl = `https://re.jrc.ec.europa.eu/api/v5_3/PVcalc?lat=${lat}&lon=${lon}&peakpower=1&loss=14&outputformat=json`
    const upstream = await fetch(pvgisUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    if (!upstream.ok) {
      return json(res, 502, { error: `PVGIS returned ${upstream.status}` })
    }
    const data = await upstream.json()
    res.writeHead(200, { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' })
    res.end(JSON.stringify(data))
  } catch (_) {
    json(res, 502, { error: 'PVGIS unreachable' })
  }
}
