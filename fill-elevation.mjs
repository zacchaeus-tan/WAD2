import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SERVICE_ROLE_KEY)

const COLS = { gain: 'elevation_gain_m', alt: 'altitude_m', dist: 'distance_km' }
const SPACING_M = 100
const MAX_POINTS = 150          // per line part
const DAILY_CALL_BUDGET = 950   // public API allows 1000/day
let calls = 0

const rad = (d) => (d * Math.PI) / 180
function haversine([lon1, lat1], [lon2, lat2]) {
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2
  return 2 * 6371000 * Math.asin(Math.sqrt(a))
}
const length = (c) => c.slice(1).reduce((s, p, i) => s + haversine(c[i], p), 0)
const parts = (g) => (g.type === 'LineString' ? [g.coordinates] : g.coordinates)

function resample(coords, spacing) {
  const out = [coords[0]]
  let carry = 0
  for (let i = 1; i < coords.length; i++) {
    const a = coords[i - 1], b = coords[i]
    const seg = haversine(a, b)
    if (seg === 0) continue
    let d = spacing - carry
    while (d <= seg) {
      const t = d / seg
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
      d += spacing
    }
    carry = seg - (d - spacing)
  }
  out.push(coords.at(-1))
  return out
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function elevations(points) {
  const result = []
  for (let i = 0; i < points.length; i += 100) {
    if (calls >= DAILY_CALL_BUDGET) throw new Error('BUDGET')
    const locations = points.slice(i, i + 100)
      .map((p) => `${p[1].toFixed(5)},${p[0].toFixed(5)}`).join('|')
    let json
    for (let attempt = 1; ; attempt++) {
      const res = await fetch(`https://api.opentopodata.org/v1/srtm30m?locations=${locations}`)
      calls++
      if (res.ok) { json = await res.json(); break }
      if (res.status === 429 && attempt < 3) { await sleep(5000 * attempt); continue }
      throw new Error(res.status === 429 ? 'BUDGET' : `Elevation API ${res.status}`)
    }
    result.push(...json.results.map((r) => r.elevation))
    await sleep(1100) // max 1 call per second
  }
  return result
}

function smooth(v, w = 5) {
  return v.map((_, i) => {
    const s = v.slice(Math.max(0, i - w), i + w + 1)
    return s.reduce((a, b) => a + b, 0) / s.length
  })
}

const { data: routes, error } = await supabase
  .from('routes')
  .select(`id, name, geometry, ${COLS.gain}, ${COLS.alt}, ${COLS.dist}`)
  .not('geometry', 'is', null)
  .or(`${COLS.gain}.is.null,${COLS.alt}.is.null`)
if (error) throw error
console.log(`${routes.length} routes to fill`)

for (const [n, r] of routes.entries()) {
  try {
    let up = 0, down = 0, maxAlt = -Infinity, meters = 0, ok = false
    for (const part of parts(r.geometry)) {
      const len = length(part)
      meters += len
      const pts = resample(part, Math.max(SPACING_M, len / MAX_POINTS))
      const raw = (await elevations(pts)).filter((v) => v != null)
      if (raw.length < 2) continue
      ok = true
      const sm = smooth(raw)
      for (let i = 1; i < sm.length; i++) {
        const diff = sm[i] - sm[i - 1]
        if (diff > 0) up += diff; else down -= diff
      }
      maxAlt = Math.max(maxAlt, ...raw)
    }
    if (!ok) { console.log(`skipped (no elevation data): ${r.name}`); continue }

    const update = {}
    if (r[COLS.gain] == null) update[COLS.gain] = Math.round(Math.max(up, down))
    if (r[COLS.alt] == null) update[COLS.alt] = Math.round(maxAlt)
    if (r[COLS.dist] == null) update[COLS.dist] = Math.round(meters / 100) / 10

    const { error: e } = await supabase.from('routes').update(update).eq('id', r.id)
    if (e) throw e
    console.log(`[${n + 1}/${routes.length}] ${r.name}`, update, `(${calls} calls)`)
  } catch (e) {
    if (e.message === 'BUDGET') {
      console.log(`Daily limit reached after ${calls} calls. Rerun tomorrow to continue.`)
      break
    }
    throw e
  }
}