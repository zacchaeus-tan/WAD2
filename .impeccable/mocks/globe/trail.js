// CAIRN globe mock, trail signs version. MapLibre GL JS draws the globe; NASA Blue Marble sits
// underneath at every zoom, with Esri World Imagery over it when it loads, so a refused Esri tile
// shows a blurrier patch instead of a hole. CARTO's dark map is the "Map" setting.
const ROUTES = window.CAIRN_BROWSE
const GRADES = {
  1: { key: 'easy', label: 'Easy', heat: '#6FDC8C', ink: '#1D7A43' },
  2: { key: 'moderate', label: 'Moderate', heat: '#F2D34F', ink: '#7A5E00' },
  3: { key: 'hard', label: 'Hard', heat: '#FF9F43', ink: '#A34D00' },
  4: { key: 'strenuous', label: 'Strenuous', heat: '#FF5B4F', ink: '#B42318' },
}
const EXPLORE_VIEW = { center: [119, 4], zoom: 2.6, bearing: 0, pitch: 0 }
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const phone = () => matchMedia('(max-width: 640px)').matches
const $ = (id) => document.getElementById(id)
const byId = new Map(ROUTES.map((route) => [route.id, route]))
const num = (n) => n.toLocaleString('en-GB')
const fact = (value, format) => (value == null ? '<span aria-label="Not listed">—</span>' : format(value))
const shortName = (name) => name.replace(/\s*\(.*\)\s*$/, '') || name
const sidePadding = () => (phone() ? { left: 0, top: 65, right: 0, bottom: 52 } : { left: 340, top: 65, right: 0, bottom: 0 })

// The grade's shape in bright heat, for the ink route tags
function shape(grade) {
  const g = GRADES[grade]
  const wide = g?.key === 'strenuous'
  return `<svg class="shape${wide ? ' is-wide' : ''}" viewBox="0 0 ${wide ? 16 : 10} 10" style="color:${g?.heat ?? '#c9d0cb'}" aria-hidden="true"><use href="#g-${g?.key ?? 'none'}"/></svg>`
}

// The same shape in the colour of its label, for the light card and board
function blaze(grade) {
  const g = GRADES[grade]
  const wide = g?.key === 'strenuous'
  return `<svg class="blaze${wide ? ' is-wide' : ''}" viewBox="0 0 ${wide ? 16 : 10} 10" aria-hidden="true"><use href="#g-${g?.key ?? 'none'}"/></svg>`
}

// ---------- Contour lines ----------
// Wobbly rings around a few imaginary peaks near the corners, leaving the middle clear for the globe
function drawContours() {
  const peaks = [[130, 170, 13], [1480, 150, 12], [1380, 880, 15], [210, 900, 12], [800, -80, 9]]
  let paths = ''
  for (const [cx, cy, rings] of peaks) {
    const a = cx * 0.013
    const b = cy * 0.021 + 1
    for (let ring = 1; ring <= rings; ring++) {
      const radius = ring * 44
      let d = ''
      for (let step = 0; step <= 96; step++) {
        const t = (step / 96) * Math.PI * 2
        const wobble = 1 + 0.16 * Math.sin(3 * t + a + ring * 0.12) + 0.08 * Math.sin(7 * t + b - ring * 0.2) + 0.04 * Math.sin(13 * t + a + b)
        d += `${step ? 'L' : 'M'}${(cx + radius * wobble * Math.cos(t)).toFixed(1)} ${(cy + radius * wobble * 0.82 * Math.sin(t)).toFixed(1)}`
      }
      paths += `<path class="${ring % 5 === 0 ? 'is-index' : ''}" d="${d}Z"/>`
    }
  }
  $('contours').innerHTML = paths
}
drawContours()

// ---------- Routes sharing a trailhead are grouped so their tags can stack ----------
const POSTS = []
for (const route of ROUTES) {
  let post = POSTS.find((p) => Math.hypot(p.lon - route.lon, p.lat - route.lat) < 0.0009)
  if (!post) {
    post = { id: POSTS.length, lon: route.lon, lat: route.lat, routes: [] }
    POSTS.push(post)
  }
  post.routes.push(route)
}

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
      { id: 'night', type: 'raster', source: 'night', layout: { visibility: 'none' } },
      { id: 'marble', type: 'raster', source: 'marble' },
      { id: 'satellite', type: 'raster', source: 'satellite', minzoom: 3, paint: { 'raster-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0, 5, 1] } },
    ],
  },
})

const HANDLERS = ['dragPan', 'scrollZoom', 'touchZoomRotate', 'doubleClickZoom', 'keyboard', 'dragRotate']
// Nothing moves the globe until the user chooses to explore
HANDLERS.forEach((handler) => map[handler].disable())
const empty = () => ({ type: 'FeatureCollection', features: [] })

map.on('load', () => {
  map.addSource('posts', {
    type: 'geojson',
    cluster: true,
    clusterRadius: 62,
    clusterMaxZoom: 9,
    // Clusters count routes, not posts
    clusterProperties: { routes: ['+', ['get', 'n']] },
    data: {
      type: 'FeatureCollection',
      features: POSTS.map((post) => ({ type: 'Feature', properties: { post: post.id, n: post.routes.length }, geometry: { type: 'Point', coordinates: [post.lon, post.lat] } })),
    },
  })
  // Invisible, but MapLibre only loads and clusters a source when a layer uses it
  map.addLayer({ id: 'posts-hidden', type: 'circle', source: 'posts', paint: { 'circle-opacity': 0, 'circle-radius': 0 } })

  map.addSource('line', { type: 'geojson', data: empty() })
  map.addLayer({ id: 'line-casing', type: 'line', source: 'line', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#101814', 'line-opacity': 0.8, 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 5, 12, 9] } })
  map.addLayer({ id: 'line', type: 'line', source: 'line', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['get', 'heat'], 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 2.5, 12, 4.5] } })

  // A hiker walking the pinned route
  map.addSource('walker', { type: 'geojson', data: empty() })
  map.addLayer({ id: 'walker', type: 'circle', source: 'walker', paint: { 'circle-radius': 5.5, 'circle-color': '#C2481A', 'circle-stroke-color': '#FBFAF7', 'circle-stroke-width': 2 } })

  map.on('render', () => phase === 'explore' && drawSigns())
  startIntro()
})

// ---------- Intro: a cairn built as the page loads ----------
let phase = 'intro'
let spinning = true
function spin() {
  if (!spinning || reduced) return
  const center = map.getCenter()
  map.jumpTo({ center: [center.lng + 0.04, center.lat] })
  requestAnimationFrame(spin)
}

function startIntro() {
  spin()
  const stones = [...document.querySelectorAll('.stone')]
  const steps = ['Loading routes', 'Placing trailheads', 'Building the cairn']
  let pct = 0
  const timer = setInterval(() => {
    pct = Math.min(100, pct + 3 + Math.random() * 6)
    stones.forEach((stone, index) => stone.classList.toggle('is-placed', pct >= (index / stones.length) * 100 + 4))
    $('intro-cairn').setAttribute('aria-valuenow', Math.round(pct))
    $('loading-pct').textContent = Math.round(pct) + '%'
    $('loading-msg').textContent = steps[Math.min(2, Math.floor(pct / 34))]
    if (pct >= 100) {
      clearInterval(timer)
      if (phase !== 'intro') return
      $('intro-status').hidden = true
      $('explore').hidden = false
      setPhase('hero')
    }
  }, reduced ? 10 : 80)
}

function setPhase(next) {
  phase = next
  document.body.className = 'is-' + next
}

function explore() {
  if (phase !== 'hero') return
  spinning = false
  setPhase('explore')
  map.flyTo({ ...EXPLORE_VIEW, zoom: phone() ? 2 : EXPLORE_VIEW.zoom, padding: sidePadding(), duration: reduced ? 0 : 2200, essential: true })
  HANDLERS.forEach((handler) => map[handler].enable())
}
$('explore').addEventListener('click', explore)
addEventListener('wheel', (event) => event.deltaY > 0 && explore(), { passive: true })
let touchY
addEventListener('touchstart', (event) => (touchY = event.touches[0].clientY), { passive: true })
addEventListener('touchmove', (event) => touchY - event.touches[0].clientY > 30 && explore(), { passive: true })

// ---------- Tags and count boxes on the globe ----------
const markers = new Map()
let drawPending = false
function drawSigns() {
  if (drawPending) return
  drawPending = true
  requestAnimationFrame(() => {
    drawPending = false
    if (!map.isSourceLoaded('posts')) return
    const seen = new Set()
    for (const feature of map.querySourceFeatures('posts')) {
      const p = feature.properties
      const key = p.cluster ? 'c' + p.cluster_id : 'p' + p.post
      if (seen.has(key)) continue
      seen.add(key)
      if (!markers.has(key)) markers.set(key, makeSign(feature))
      const marker = markers.get(key)
      if (!marker._map) marker.addTo(map)
    }
    for (const [key, marker] of markers) {
      // A tag under the cursor stays, so it never loses its hover
      if (!seen.has(key) && marker._map && !marker.getElement().matches(':hover')) marker.remove()
    }
  })
}

function makeSign(feature) {
  return feature.properties.cluster ? makeJunction(feature) : makePost(POSTS[feature.properties.post])
}

// Several routes close together: a square with the count
function makeJunction(feature) {
  const count = feature.properties.routes
  const coordinates = feature.geometry.coordinates
  const el = document.createElement('button')
  el.type = 'button'
  el.className = 'cluster' + (count >= 20 ? ' is-big' : '')
  el.textContent = count
  el.setAttribute('aria-label', `${count} routes here, zoom in`)
  el.dataset.testid = 'route-cluster-pill'
  el.addEventListener('click', async (event) => {
    event.stopPropagation()
    const zoom = await map.getSource('posts').getClusterExpansionZoom(feature.properties.cluster_id)
    map.easeTo({ center: coordinates, zoom: zoom + 0.4, duration: reduced ? 0 : 900 })
  })
  return new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(coordinates)
}

// A square ink tag per route, stacked when routes share a trailhead so none hides another
function makePost(post) {
  const el = document.createElement('div')
  el.className = 'chip-stack'
  el.innerHTML = post.routes.map((route) => {
    const g = GRADES[route.grade]
    return `<button class="chip" type="button" style="--chip-ink:${g?.ink ?? '#5f6b65'}" data-id="${route.id}" title="${route.name}" aria-label="${route.name}, ${g?.label ?? 'Not rated'}" data-testid="route-pill">${shape(route.grade)}<span class="chip-name">${shortName(route.name)}</span></button>`
  }).join('')
  for (const chip of el.querySelectorAll('.chip')) {
    const route = byId.get(chip.dataset.id)
    chip.addEventListener('mouseenter', () => !pinned && showCard(route, true, chip))
    chip.addEventListener('mouseleave', () => !pinned && hideCard())
    chip.addEventListener('focus', () => !pinned && showCard(route, true, chip))
    chip.addEventListener('blur', () => !pinned && hideCard())
    chip.addEventListener('click', (event) => {
      event.stopPropagation()
      pinned = route
      showCard(route, false, chip)
    })
  }
  return new maplibregl.Marker({ element: el, anchor: 'bottom', offset: [0, -6] }).setLngLat([post.lon, post.lat])
}

// ---------- Field notes card ----------
let pinned = null
let cardRoute = null
let cardChip = null
const card = $('card')

function showCard(route, peek, chip) {
  cardRoute = route
  cardChip = chip
  const g = GRADES[route.grade]
  card.classList.toggle('is-peek', peek)
  card.innerHTML = `
    <div class="card-body">
      <div class="card-head">
        <p class="label">${route.country}</p>
        <button class="card-close" type="button" aria-label="Close" data-testid="route-card-close"><svg><use href="#i-close"/></svg></button>
      </div>
      <h2 class="card-name" title="${route.name}">${route.name}</h2>
      <div class="card-top">
        <span class="grade" style="color:${g?.ink ?? '#5f6b65'}">${blaze(route.grade)}${g?.label ?? 'Not rated'}</span>
        ${route.rating ? `<span class="rating"><svg><use href="#i-star"/></svg>${route.rating.toFixed(1)}</span>` : '<span class="no-reviews">No reviews yet</span>'}
      </div>
      <dl class="facts">
        <div><dt>Distance</dt><dd>${route.km.toFixed(1)} km</dd></div>
        <div><dt>Climb</dt><dd>${fact(route.climb, (v) => `+${num(v)} m`)}</dd></div>
        <div><dt>Days</dt><dd>${route.days}</dd></div>
        <div><dt>Highest</dt><dd>${fact(route.alt, (v) => `${num(v)} m`)}</dd></div>
      </dl>
      <button class="plank is-right card-go" type="button" data-testid="route-card-view-more">Open route</button>
    </div>`
  card.hidden = false
  card.querySelector('.card-close').addEventListener('click', unpin)
  card.querySelector('.card-go').addEventListener('click', () => dive(route))
  document.querySelectorAll('.is-active').forEach((el) => el.classList.remove('is-active'))
  chip.classList.add('is-active')
  chip.closest('.chip-stack').classList.add('is-active')
  showLine(route, !peek)
  placeCard()
}

function hideCard() {
  card.hidden = true
  cardRoute = null
  cardChip = null
  document.querySelectorAll('.is-active').forEach((el) => el.classList.remove('is-active'))
  showLine(null)
}

function unpin() {
  pinned = null
  hideCard()
}

// Beside the tag, clear of the tag and the board; docked to the bottom on phones (CSS)
function placeCard() {
  if (card.hidden || !cardChip || phone()) return
  const rect = cardChip.getBoundingClientRect()
  const boardRight = $('board').getBoundingClientRect().right
  const w = card.offsetWidth
  const h = card.offsetHeight
  const gap = 14
  const minLeft = boardRight + 12
  const maxTop = innerHeight - h - 16
  const top = 80
  let x = rect.right + gap
  let y = Math.max(top, Math.min(maxTop, rect.top + rect.height / 2 - h / 2))
  if (x + w > innerWidth - 16) x = rect.left - gap - w
  if (x < minLeft) {
    x = Math.max(minLeft, Math.min(innerWidth - w - 16, rect.left + rect.width / 2 - w / 2))
    y = rect.bottom + gap + h < innerHeight - 16 ? rect.bottom + gap : Math.max(top, rect.top - gap - h)
  }
  card.style.left = x + 'px'
  card.style.top = y + 'px'
}
map.on('move', placeCard)
map.on('click', () => pinned && unpin())

// ---------- The route on the map, and a hiker walking it ----------
let walkFrame = null
function showLine(route, walk = false) {
  cancelAnimationFrame(walkFrame)
  map.getSource('walker')?.setData(empty())
  const source = map.getSource('line')
  if (!source) return
  if (!route) {
    source.setData(empty())
    return
  }
  const heat = GRADES[route.grade]?.heat ?? '#c9d0cb'
  source.setData({ type: 'FeatureCollection', features: route.map.map((coordinates) => ({ type: 'Feature', properties: { heat }, geometry: { type: 'LineString', coordinates } })) })
  if (walk && !reduced) walkAlong(route.map.reduce((a, b) => (b.length > a.length ? b : a)))
}

function walkAlong(line) {
  if (line.length < 2) return
  const started = performance.now()
  const seconds = 9
  function step(now) {
    // The first frame's time can be slightly before `started`, which would be a negative index
    const progress = ((Math.max(0, now - started) / 1000) % seconds) / seconds
    const position = progress * (line.length - 1)
    const index = Math.floor(position)
    const next = line[Math.min(index + 1, line.length - 1)]
    const t = position - index
    const point = [line[index][0] + (next[0] - line[index][0]) * t, line[index][1] + (next[1] - line[index][1]) * t]
    map.getSource('walker').setData({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: point } })
    walkFrame = requestAnimationFrame(step)
  }
  walkFrame = requestAnimationFrame(step)
}

// ---------- Dive, then (in the app) open the route page ----------
function dive(route) {
  document.body.classList.add('diving')
  showLine(route)
  const bounds = route.map.flat().reduce((b, c) => b.extend(c), new maplibregl.LngLatBounds(route.map[0][0], route.map[0][0]))
  const camera = map.cameraForBounds(bounds, { padding: 80, maxZoom: 13 })
  map.flyTo({ center: camera.center, zoom: Math.min(camera.zoom, 13), pitch: 50, bearing: 25, duration: reduced ? 0 : 2600, essential: true })
  map.once('moveend', () => {
    $('dive-name').textContent = route.name
    $('dive').classList.add('is-on')
    // Mock only: come back to the globe instead of routing to /routes/:id
    setTimeout(() => {
      $('dive').classList.remove('is-on')
      document.body.classList.remove('diving')
      unpin()
      map.jumpTo(EXPLORE_VIEW)
    }, 1800)
  })
}

// ---------- Notice board ----------
const countries = Object.entries(ROUTES.reduce((acc, route) => ((acc[route.country] ||= []).push(route), acc), {})).sort((a, b) => b[1].length - a[1].length)
$('count-total').textContent = ROUTES.length
$('count-shown').textContent = ROUTES.length
$('count-countries').textContent = countries.length

$('ways').innerHTML = countries.map(([name, list]) => `<li><button class="plank is-right" type="button" aria-pressed="false" data-country="${name}" data-testid="globe-country-button"><span>${name}</span><span class="n">${list.length}<span style="position:absolute;width:1px;height:1px;overflow:hidden"> routes</span></span></button></li>`).join('')

$('ways').addEventListener('click', (event) => {
  const button = event.target.closest('button')
  if (!button) return
  const list = countries.find(([name]) => name === button.dataset.country)[1]
  document.querySelectorAll('#ways button').forEach((b) => b.setAttribute('aria-pressed', b === button))
  const bounds = list.reduce((b, r) => b.extend([r.lon, r.lat]), new maplibregl.LngLatBounds([list[0].lon, list[0].lat], [list[0].lon, list[0].lat]))
  unpin()
  map.fitBounds(bounds, { padding: 70, maxZoom: 8, duration: reduced ? 0 : 1600 })
  if (phone()) toggleBoard(false)
})

$('blazes').innerHTML = [1, 2, 3, 4, null].map((grade) => `<li style="color:${GRADES[grade]?.ink ?? '#5f6b65'}">${blaze(grade)}${GRADES[grade]?.label ?? 'Not rated'}</li>`).join('')

document.querySelectorAll('.switch button').forEach((button) =>
  button.addEventListener('click', () => {
    const plainMap = button.dataset.map === 'map'
    document.querySelectorAll('.switch button').forEach((b) => b.setAttribute('aria-pressed', b === button))
    map.setLayoutProperty('night', 'visibility', plainMap ? 'visible' : 'none')
    map.setLayoutProperty('marble', 'visibility', plainMap ? 'none' : 'visible')
    map.setLayoutProperty('satellite', 'visibility', plainMap ? 'none' : 'visible')
  }),
)

function toggleBoard(open) {
  $('board').classList.toggle('is-open', open)
  $('board-toggle').setAttribute('aria-expanded', open)
}
$('board-toggle').addEventListener('click', () => toggleBoard(!$('board').classList.contains('is-open')))

// ---------- Compass, zoom, readout ----------
$('zoom-in').addEventListener('click', () => map.zoomIn())
$('zoom-out').addEventListener('click', () => map.zoomOut())
$('reset').addEventListener('click', () => {
  unpin()
  document.querySelectorAll('#ways button').forEach((b) => b.setAttribute('aria-pressed', false))
  map.flyTo({ ...EXPLORE_VIEW, duration: reduced ? 0 : 1400 })
})

const scale = new maplibregl.ScaleControl({ maxWidth: 90, unit: 'metric' })
$('readout').append(scale.onAdd(map))

function updateInstruments() {
  $('compass-card').setAttribute('transform', `rotate(${-map.getBearing()} 32 32)`)
  const { lat, lng } = map.getCenter()
  const wrapped = ((lng + 540) % 360) - 180
  $('readout-pos').textContent = `${lat >= 0 ? 'N' : 'S'} ${Math.abs(lat).toFixed(2)}°  ${wrapped >= 0 ? 'E' : 'W'} ${Math.abs(wrapped).toFixed(2)}°`
}
map.on('move', updateInstruments)
updateInstruments()

addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && pinned) unpin()
})
