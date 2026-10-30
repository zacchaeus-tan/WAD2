// Turns a route's GeoJSON line into an SVG path fitted to a box, for tiles and the banner.
// Each part of a MultiLineString becomes its own subpath. The line is simplified after
// fitting, so a tile draws tens of points instead of thousands.

const TOLERANCE = 0.75 // px in the box: how far a dropped point may sit from the line

// Returns a path `d` string, or null when there is nothing to draw.
export function geometryToPath(geometry, { width = 400, height = 240 } = {}) {
  const parts = lineParts(geometry)
  if (!parts.length) {
    return null
  }

  // Shrink longitude by the cosine of the mean latitude so the shape isn't stretched.
  // y is minus latitude because SVG y grows downwards.
  const points = parts.flat()
  const meanLat = points.reduce((sum, [, lat]) => sum + lat, 0) / points.length
  const xScale = Math.cos((meanLat * Math.PI) / 180)
  const projected = parts.map((part) => part.map(([lon, lat]) => [lon * xScale, -lat]))

  // Fit inside the box with the aspect ratio kept, then centre.
  // A loop, because Math.min(...points) fails on very long lines.
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [x, y] of projected.flat()) {
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }
  const spanX = maxX - minX
  const spanY = maxY - minY
  const scale = Math.min(spanX ? width / spanX : Infinity, spanY ? height / spanY : Infinity)
  if (!Number.isFinite(scale)) {
    return null // a single point
  }
  const offsetX = (width - spanX * scale) / 2
  const offsetY = (height - spanY * scale) / 2

  const d = projected
    .map((part) =>
      part.map(([x, y]) => [(x - minX) * scale + offsetX, (y - minY) * scale + offsetY]),
    )
    .map((part) => roundPoints(simplify(part, TOLERANCE)))
    .filter((part) => part.length > 1)
    .map((part) => `M${part.map(([x, y]) => `${x} ${y}`).join('L')}`)
    .join('')

  return d || null
}

// The geometry's lines as arrays of [lon, lat], skipping bad points and empty parts
function lineParts(geometry) {
  if (!geometry || !Array.isArray(geometry.coordinates)) {
    return []
  }
  const parts =
    geometry.type === 'LineString'
      ? [geometry.coordinates]
      : geometry.type === 'MultiLineString'
        ? geometry.coordinates
        : []

  return parts
    .filter(Array.isArray)
    .map((part) =>
      part.filter(
        (point) => Array.isArray(point) && Number.isFinite(point[0]) && Number.isFinite(point[1]),
      ),
    )
    .filter((part) => part.length > 1)
}

// Ramer–Douglas–Peucker: keep both ends, then keep the farthest point between two kept
// points while it sits more than the tolerance away, and repeat on each side of it.
function simplify(points, tolerance) {
  if (points.length < 3) {
    return points
  }
  const keep = points.map(() => false)
  keep[0] = true
  keep[points.length - 1] = true

  const stack = [[0, points.length - 1]]
  while (stack.length) {
    const [first, last] = stack.pop()
    let farthest = -1
    let farthestDistance = tolerance
    for (let i = first + 1; i < last; i++) {
      const distance = distanceToSegment(points[i], points[first], points[last])
      if (distance > farthestDistance) {
        farthest = i
        farthestDistance = distance
      }
    }
    if (farthest !== -1) {
      keep[farthest] = true
      stack.push([first, farthest], [farthest, last])
    }
  }

  return points.filter((_, i) => keep[i])
}

// Distance to the segment, not the endless line, so a loop that ends where it started
// doesn't collapse to a dot
function distanceToSegment([px, py], [ax, ay], [bx, by]) {
  const dx = bx - ax
  const dy = by - ay
  const lengthSquared = dx * dx + dy * dy
  const t = lengthSquared
    ? Math.min(Math.max(((px - ax) * dx + (py - ay) * dy) / lengthSquared, 0), 1)
    : 0
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

// One decimal place, dropping points that land on the one before
function roundPoints(points) {
  const rounded = []
  for (const [x, y] of points) {
    const point = [Math.round(x * 10) / 10, Math.round(y * 10) / 10]
    const previous = rounded[rounded.length - 1]
    if (!previous || previous[0] !== point[0] || previous[1] !== point[1]) {
      rounded.push(point)
    }
  }
  return rounded
}
