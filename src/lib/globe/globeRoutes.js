// Route data helpers for the globe page (src/views/RoutesGlobe.vue): checking route lines,
// placing pills, and the labels shown on pills and route cards. Plain functions with no
// map or Vue state, so they can be tested on their own.

// Route pills closer together than this are stacked so none is hidden behind another
export const stackRadiusMetres = 100
const stackSpacingPx = 28

const difficultyNames = { 1: 'Easy', 2: 'Moderate', 3: 'Hard', 4: 'Strenuous' }
// Also used for the route line colours in globeMap.js; the legend in GlobePanel.vue matches these
export const difficultyColours = { 1: '#24883b', 2: '#e6b700', 3: '#ec741c', 4: '#cb3030' }
export const unratedColour = '#64748b'

export function isPosition(position) {
  return (
    Array.isArray(position) &&
    position.length >= 2 &&
    Number.isFinite(position[0]) &&
    Number.isFinite(position[1])
  )
}

function isLineString(coordinates) {
  return Array.isArray(coordinates) && coordinates.length >= 2 && coordinates.every(isPosition)
}

// True for a GeoJSON LineString or MultiLineString the map can draw
export function hasRenderableGeometry(geometry) {
  if (!geometry || !Array.isArray(geometry.coordinates)) {
    return false
  }

  if (geometry.type === 'LineString') {
    return isLineString(geometry.coordinates)
  }

  return (
    geometry.type === 'MultiLineString' &&
    geometry.coordinates.length > 0 &&
    geometry.coordinates.every(isLineString)
  )
}

// A LineString is one line and a MultiLineString is several; this always gives a list of lines
export function lineParts(geometry) {
  return geometry.type === 'LineString' ? [geometry.coordinates] : geometry.coordinates
}

// The south-west and north-east corners of a route line, for framing it on the map
export function routeBounds(geometry) {
  let west = Infinity
  let south = Infinity
  let east = -Infinity
  let north = -Infinity
  for (const line of lineParts(geometry)) {
    for (const [lng, lat] of line) {
      west = Math.min(west, lng)
      south = Math.min(south, lat)
      east = Math.max(east, lng)
      north = Math.max(north, lat)
    }
  }
  return [
    [west, south],
    [east, north],
  ]
}

// A route's pill sits at its trailhead, which the latitude and longitude columns hold
export function routePosition(route) {
  const position = [Number(route.longitude), Number(route.latitude)]
  return route.longitude != null && route.latitude != null && isPosition(position) ? position : null
}

// 1 (easy) to 4 (strenuous), from whichever difficulty the route has
export function difficultyLevel(route) {
  const value =
    route.effective_difficulty ?? route.official_difficulty ?? route.technical_rating
  const labels = {
    easy: 1,
    moderate: 2,
    hard: 3,
    strenuous: 4,
  }
  const numericValue =
    typeof value === 'string' && Object.hasOwn(labels, value.toLocaleLowerCase())
      ? labels[value.toLocaleLowerCase()]
      : Number(value)

  return Number.isFinite(numericValue) ? Math.min(4, Math.max(1, Math.round(numericValue))) : null
}

export function difficultyColour(difficulty) {
  return difficultyColours[difficulty] ?? unratedColour
}

function formatRouteDistance(distance) {
  if (distance == null || distance === '' || !Number.isFinite(Number(distance))) {
    return 'Route'
  }

  return `${Number(distance).toLocaleString(undefined, { maximumFractionDigits: 1 })} km`
}

function formatRouteDuration(days) {
  if (days == null || days === '') {
    return 'Not listed'
  }

  return `${days} ${Number(days) === 1 ? 'day' : 'days'}`
}

// Everything a route's pill and card show, ready to display
export function routeCardDetails(route) {
  const difficulty = difficultyLevel(route)
  return {
    routeId: route.id,
    name: route.name || 'Unnamed route',
    country: route.country || 'Not listed',
    difficulty,
    difficultyLabel: difficultyNames[difficulty] ?? 'Not rated',
    durationLabel: formatRouteDuration(route.duration_days),
    distanceLabel: formatRouteDistance(route.distance_km),
    ratingLabel: route.avg_rating == null ? '' : Number(route.avg_rating).toFixed(1),
  }
}

function distanceInMetres([lng1, lat1], [lng2, lat2]) {
  const toRadians = Math.PI / 180
  const latDelta = (lat2 - lat1) * toRadians
  const lngDelta = (lng2 - lng1) * toRadians
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(lat1 * toRadians) * Math.cos(lat2 * toRadians) * Math.sin(lngDelta / 2) ** 2
  return 2 * 6371000 * Math.asin(Math.sqrt(a))
}

// Several routes share a trailhead, so their pills would sit exactly on top of each other
// at every zoom. Routes starting close to each other are stacked into a column instead,
// each pill shifted up or down by its own pixel offset (properties.stackOffsetY).
export function assignMarkerStacks(markerFeatures) {
  const stacks = []
  for (const feature of markerFeatures) {
    const position = feature.geometry.coordinates
    const stack = stacks.find(
      (group) => distanceInMetres(group[0].geometry.coordinates, position) < stackRadiusMetres,
    )
    if (stack) {
      stack.push(feature)
    } else {
      stacks.push([feature])
    }
  }

  for (const stack of stacks) {
    // Northernmost pill on top, so zooming in (which spreads them north-south) never
    // pushes one pill back onto another
    stack.sort((a, b) => b.geometry.coordinates[1] - a.geometry.coordinates[1])
    stack.forEach((feature, index) => {
      feature.properties.stackOffsetY = (index - (stack.length - 1) / 2) * stackSpacingPx
    })
  }
}
