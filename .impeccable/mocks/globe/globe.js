// CAIRN globe mock. MapLibre GL JS draws the globe; tiles are Esri World Imagery and CARTO
// dark basemap (the app's no-key fallbacks), NASA Blue Marble far out.
const ROUTES = window.CAIRN_BROWSE
const GRADES = {
  1: { key: 'easy', label: 'Easy', heat: '#6FDC8C', ink: '#1D7A43' },
  2: { key: 'moderate', label: 'Moderate', heat: '#F2D34F', ink: '#7A5E00' },
  3: { key: 'hard', label: 'Hard', heat: '#FF9F43', ink: '#A34D00' },
  4: { key: 'strenuous', label: 'Strenuous', heat: '#FF5B4F', ink: '#B42318' },
}
const EXPLORE_VIEW = { center: [119, 4], zoom: 2.6 }
// Keeps the globe centred in the space beside the index panel on wide screens
const sidePadding = () => (phone() ? { left: 0, top: 0, right: 0, bottom: 0 } : { left: 330, top: 40, right: 0, bottom: 0 })
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const phone = () => matchMedia('(max-width: 640px)').matches
const $ = (id) => document.getElementById(id)
const byId = new Map(ROUTES.map((r) => [r.id, r]))

function shape(grade, cls = 'shape') {
  const g = GRADES[grade]
  const wide = g.key === 'strenuous'
  return `<svg class="${cls}${wide ? ' is-wide' : ''}" viewBox="0 0 ${wide ? 16 : 10} 10" style="color:${'{c}'}"><use href="#g-${g.key}"/></svg>`
}
const shapeIn = (grade, colour) => shape(grade).replace('{c}', colour)
const num = (n) => n.toLocaleString('en-GB')
// Missing values show a dash that screen readers hear as "Not listed" (design system content rule)
const fact = (value, format) => (value == null ? '<span aria-label="Not listed">—</span>' : format(value))

// ---------- Map ----------
const map = new maplibregl.Map({
  container: 'globe',
  attributionControl: { compact: true },
  center: [100, 8],
  zoom: phone() ? 1.1 : 1.6,
  maxPitch: 60,
  style: {
    version: 8,
    projection: { type: 'globe' },
    sky: {
      'sky-color': '#101814',
      'horizon-color': '#1f5b43',
      'fog-color': '#101814',
      'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 0.9, 5, 0.6, 8, 0],
    },
    sources: {
      marble: {
        type: 'raster', tileSize: 256, maxzoom: 8,
        tiles: ['https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg'],
        attribution: 'NASA GIBS',
      },
      satellite: {
        type: 'raster', tileSize: 256, maxzoom: 18,
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        attribution: 'Esri World Imagery',
      },
      night: {
        type: 'raster', tileSize: 256,
        tiles: ['https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png', 'https://b.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png'],
        attribution: '© OpenStreetMap © CARTO',
      },
    },
    layers: [
      { id: 'space', type: 'background', paint: { 'background-color': '#101814' } },
      { id: 'night', type: 'raster', source: 'night', layout: { visibility: 'none' } },
      { id: 'marble', type: 'raster', source: 'marble', maxzoom: 6, paint: { 'raster-opacity': ['interpolate', ['linear'], ['zoom'], 3, 1, 5.5, 0] } },
      { id: 'satellite', type: 'raster', source: 'satellite', minzoom: 3, paint: { 'raster-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0, 5, 1] } },
    ],
  },
})

const HANDLERS = ['dragPan', 'scrollZoom', 'touchZoomRotate', 'doubleClickZoom', 'keyboard', 'dragRotate']
// Nothing moves the globe until the user chooses to explore
HANDLERS.forEach((h) => map[h].disable())

map.on('load', () => {
  map.addSource('routes', {
    type: 'geojson',
    cluster: true,
    clusterRadius: 48,
    clusterMaxZoom: 9,
    data: {
      type: 'FeatureCollection',
      features: ROUTES.map((r) => ({ type: 'Feature', properties: { id: r.id }, geometry: { type: 'Point', coordinates: [r.lon, r.lat] } })),
    },
  })
  // An invisible layer so the clustered source stays loaded and queryable
  map.addLayer({ id: 'routes-hidden', type: 'circle', source: 'routes', paint: { 'circle-opacity': 0, 'circle-radius': 0 } })
  map.addSource('line', { type: 'geojson', data: empty() })
  // Dark casing under the heat line so it holds on bright satellite ground
  map.addLayer({ id: 'line-casing', type: 'line', source: 'line', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#101814', 'line-opacity': 0.75, 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 5, 12, 9] } })
  map.addLayer({ id: 'line', type: 'line', source: 'line', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['get', 'heat'], 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 2.5, 12, 4.5] } })
  map.on('render', () => phase === 'explore' && drawMarkers())
  startIntro()
})

const empty = () => ({ type: 'FeatureCollection', features: [] })

// ---------- Intro: load, spin, explore ----------
let phase = 'intro'
let spinning = true
function spin() {
  if (!spinning || reduced) return
  const c = map.getCenter()
  map.jumpTo({ center: [c.lng + 0.04, c.lat] })
  requestAnimationFrame(spin)
}

function startIntro() {
  spin()
  const steps = ['Loading routes', 'Placing trailheads', 'Drawing the globe']
  let pct = 0
  const timer = setInterval(() => {
    pct = Math.min(100, pct + 3 + Math.random() * 7)
    $('bar-fill').style.width = pct + '%'
    $('loading-pct').textContent = Math.round(pct) + '%'
    document.querySelector('.bar').setAttribute('aria-valuenow', Math.round(pct))
    $('loading-msg').textContent = steps[Math.min(2, Math.floor(pct / 34))]
    if (pct >= 100) {
      clearInterval(timer)
      if (phase !== 'intro') return
      $('loading').hidden = true
      $('explore').hidden = false
      setPhase('hero')
    }
  }, reduced ? 10 : 70)
}

function setPhase(p) {
  phase = p
  document.body.className = 'is-' + p
}

function explore() {
  if (phase === 'explore') return
  spinning = false
  setPhase('explore')
  map.flyTo({ ...EXPLORE_VIEW, zoom: phone() ? 2 : EXPLORE_VIEW.zoom, padding: sidePadding(), duration: reduced ? 0 : 2200, essential: true })
  HANDLERS.forEach((h) => map[h].enable())
}
$('explore').addEventListener('click', explore)
addEventListener('wheel', (e) => phase === 'hero' && e.deltaY > 0 && explore(), { passive: true })
let touchY
addEventListener('touchstart', (e) => (touchY = e.touches[0].clientY), { passive: true })
addEventListener('touchmove', (e) => phase === 'hero' && touchY - e.touches[0].clientY > 30 && explore(), { passive: true })

// ---------- Chips and clusters as HTML markers ----------
const markers = new Map()
let drawPending = false
function drawMarkers() {
  if (drawPending) return
  drawPending = true
  requestAnimationFrame(() => {
    drawPending = false
    const seen = new Set()
    for (const f of map.querySourceFeatures('routes')) {
      const p = f.properties
      const key = p.cluster ? 'c' + p.cluster_id : 'r' + p.id
      if (seen.has(key)) continue
      seen.add(key)
      if (!markers.has(key)) markers.set(key, makeMarker(f, key))
      const m = markers.get(key)
      if (!m._map) m.addTo(map)
    }
    for (const [key, m] of markers) if (!seen.has(key)) m.remove()
  })
}

function makeMarker(f, key) {
  const p = f.properties
  const el = document.createElement('button')
  el.type = 'button'
  if (p.cluster) {
    const n = p.point_count
    el.className = 'cluster' + (n >= 20 ? ' is-big' : '')
    el.textContent = n
    el.setAttribute('aria-label', `${n} routes here, zoom in`)
    el.dataset.testid = 'route-cluster-pill'
    el.addEventListener('click', async (e) => {
      e.stopPropagation()
      const zoom = await map.getSource('routes').getClusterExpansionZoom(p.cluster_id)
      map.easeTo({ center: f.geometry.coordinates, zoom: zoom + 0.4, duration: reduced ? 0 : 900 })
    })
    return new maplibregl.Marker({ element: el }).setLngLat(f.geometry.coordinates)
  }
  const r = byId.get(p.id)
  const g = GRADES[r.grade]
  el.className = 'chip'
  el.style.setProperty('--chip-ink', g.ink)
  el.dataset.testid = 'route-pill'
  el.dataset.id = r.id
  el.innerHTML = `${shapeIn(r.grade, g.heat)}<span class="chip-name">${shortName(r.name)}</span>`
  el.setAttribute('aria-label', `${r.name}, ${g.label}`)
  el.addEventListener('mouseenter', () => !pinned && showCard(r, true))
  el.addEventListener('mouseleave', () => !pinned && hideCard())
  el.addEventListener('focus', () => !pinned && showCard(r, true))
  el.addEventListener('blur', () => !pinned && hideCard())
  el.addEventListener('click', (e) => { e.stopPropagation(); pin(r) })
  return new maplibregl.Marker({ element: el, anchor: 'bottom', offset: [0, -6] }).setLngLat([r.lon, r.lat])
}

// "Gunung Merbabu (Wekas BC)" -> "Gunung Merbabu"
const shortName = (name) => name.replace(/\s*\(.*\)\s*$/, '')

// ---------- The route card ----------
let pinned = null
let cardRoute = null
const card = $('card')

function showCard(r, peek) {
  cardRoute = r
  const g = GRADES[r.grade]
  card.classList.toggle('is-peek', peek)
  card.innerHTML = `
    <div class="card-body">
      <div class="card-head">
        <p class="label">${r.country}</p>
        <button class="card-close" type="button" aria-label="Close"><svg><use href="#i-close"/></svg></button>
      </div>
      <h2 class="card-name" title="${r.name}">${r.name}</h2>
      <div class="card-top">
        <span class="grade" style="color:${g.ink}">${shapeIn(r.grade, g.ink)}${g.label}</span>
        ${r.rating ? `<span class="rating"><svg><use href="#i-star"/></svg>${r.rating.toFixed(1)}<span style="color:var(--granite-500);font-weight:500">(${r.reviews})</span></span>` : '<span class="no-reviews">No reviews yet</span>'}
      </div>
      <dl class="facts">
        <div><dt>Distance</dt><dd>${r.km.toFixed(1)} km</dd></div>
        <div><dt>Climb</dt><dd>${fact(r.climb, (v) => `+${num(v)} m`)}</dd></div>
        <div><dt>Days</dt><dd>${r.days}</dd></div>
        <div><dt>Highest</dt><dd>${fact(r.alt, (v) => `${num(v)} m`)}</dd></div>
      </dl>
      <button class="btn is-small" type="button" data-testid="route-card-open">Open route<svg><use href="#i-arrow"/></svg></button>
    </div>`
  card.hidden = false
  card.querySelector('.card-close').addEventListener('click', unpin)
  card.querySelector('.btn').addEventListener('click', () => dive(r))
  document.querySelectorAll('.chip.is-active').forEach((c) => c.classList.remove('is-active'))
  document.querySelector(`.chip[data-id="${r.id}"]`)?.classList.add('is-active')
  showLine(r)
  placeCard()
}

function hideCard() {
  card.hidden = true
  cardRoute = null
  document.querySelectorAll('.chip.is-active').forEach((c) => c.classList.remove('is-active'))
  showLine(null)
}

function pin(r) {
  pinned = r
  showCard(r, false)
}
function unpin() {
  pinned = null
  hideCard()
}

// Beside the chip, on whichever side has room; docked to the bottom on phones (CSS).
// Measured from the chip's edges, not its anchor point: the chip is centred on that point,
// so a card placed from it would cover half the chip and steal its hover.
function placeCard() {
  if (card.hidden || !cardRoute || phone()) return
  const pt = map.project([cardRoute.lon, cardRoute.lat])
  const chip = document.querySelector(`.chip[data-id="${cardRoute.id}"]`)
  const halfChip = (chip?.offsetWidth ?? 0) / 2
  const chipTop = pt.y - 6 - (chip?.offsetHeight ?? 28)
  const w = card.offsetWidth
  const h = card.offsetHeight
  const gap = 12
  const edge = 16
  let x = pt.x + halfChip + gap
  let y = Math.max(80, Math.min(innerHeight - h - edge, pt.y - h / 2))
  if (x + w > innerWidth - edge) x = pt.x - halfChip - gap - w
  // No room either side: centre it under the chip, or above if there's no room below
  if (x < edge) {
    x = Math.max(edge, Math.min(innerWidth - w - edge, pt.x - w / 2))
    y = pt.y + gap + h < innerHeight - edge ? pt.y + gap : chipTop - gap - h
  }
  card.style.left = x + 'px'
  card.style.top = y + 'px'
}
map.on('move', placeCard)
map.on('click', () => pinned && unpin())

function showLine(r) {
  const src = map.getSource('line')
  if (!src) return
  src.setData(r ? { type: 'FeatureCollection', features: r.map.map((coords) => ({ type: 'Feature', properties: { heat: GRADES[r.grade].heat }, geometry: { type: 'LineString', coordinates: coords } })) } : empty())
}

// ---------- Dive onto a route, fade to night, then (in the app) open its page ----------
function dive(r) {
  document.body.classList.add('diving')
  showLine(r)
  const bounds = r.map.flat().reduce((b, c) => b.extend(c), new maplibregl.LngLatBounds(r.map[0][0], r.map[0][0]))
  const cam = map.cameraForBounds(bounds, { padding: 80, maxZoom: 13 })
  map.flyTo({ center: cam.center, zoom: Math.min(cam.zoom, 13), pitch: 50, bearing: 25, duration: reduced ? 0 : 2600, essential: true })
  map.once('moveend', () => {
    $('dive-name').textContent = r.name
    $('dive').classList.add('is-on')
    // Mock only: come back to the globe instead of routing to /routes/:id
    setTimeout(() => {
      $('dive').classList.remove('is-on')
      document.body.classList.remove('diving')
      unpin()
      map.jumpTo({ ...EXPLORE_VIEW, pitch: 0, bearing: 0 })
    }, 1800)
  })
}

// ---------- Index panel ----------
const countries = Object.entries(
  ROUTES.reduce((acc, r) => ((acc[r.country] ||= []).push(r), acc), {}),
).sort((a, b) => b[1].length - a[1].length)

$('count-total').textContent = ROUTES.length
$('count-shown').textContent = ROUTES.length
$('count-countries').textContent = countries.length

$('countries').innerHTML = countries
  .map(([name, list], i) => `<li><button type="button" aria-pressed="false" data-country="${name}"><span class="i">${String(i + 1).padStart(2, '0')}</span>${name}<span class="n">${list.length}</span></button></li>`)
  .join('')

$('countries').addEventListener('click', (e) => {
  const btn = e.target.closest('button')
  if (!btn) return
  const list = countries.find(([n]) => n === btn.dataset.country)[1]
  document.querySelectorAll('#countries button').forEach((b) => b.setAttribute('aria-pressed', b === btn))
  const bounds = list.reduce((b, r) => b.extend([r.lon, r.lat]), new maplibregl.LngLatBounds([list[0].lon, list[0].lat], [list[0].lon, list[0].lat]))
  unpin()
  map.fitBounds(bounds, { padding: phone() ? 60 : { top: 100, bottom: 60, left: 60, right: 60 }, maxZoom: 8, duration: reduced ? 0 : 1600 })
  if (phone()) toggleIndex(false)
})

$('key').innerHTML = Object.entries(GRADES)
  .map(([k, g]) => `<li style="color:${g.ink}">${shapeIn(k, g.ink)}${g.label}</li>`)
  .join('')

document.querySelectorAll('.switch button').forEach((btn) =>
  btn.addEventListener('click', () => {
    // "Map" is the dark CARTO basemap; "Satellite" is Blue Marble fading into Esri imagery
    const night = btn.dataset.map === 'map'
    document.querySelectorAll('.switch button').forEach((b) => b.setAttribute('aria-checked', b === btn))
    map.setLayoutProperty('night', 'visibility', night ? 'visible' : 'none')
    map.setLayoutProperty('marble', 'visibility', night ? 'none' : 'visible')
    map.setLayoutProperty('satellite', 'visibility', night ? 'none' : 'visible')
  }),
)

function toggleIndex(open) {
  $('index').classList.toggle('is-open', open)
  $('index-toggle').setAttribute('aria-expanded', open)
}
$('index-toggle').addEventListener('click', () => toggleIndex(!$('index').classList.contains('is-open')))

$('zoom-in').addEventListener('click', () => map.zoomIn())
$('zoom-out').addEventListener('click', () => map.zoomOut())
$('reset').addEventListener('click', () => {
  unpin()
  document.querySelectorAll('#countries button').forEach((b) => b.setAttribute('aria-pressed', false))
  map.flyTo({ ...EXPLORE_VIEW, pitch: 0, bearing: 0, duration: reduced ? 0 : 1400 })
})
addEventListener('keydown', (e) => e.key === 'Escape' && pinned && unpin())
