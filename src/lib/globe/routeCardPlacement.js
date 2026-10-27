// Decides which side of a route's pill its card opens on, so the card covers as little of the
// route's line as possible. `map` is the MapLibre map, used to turn coordinates into screen points.

import { lineParts } from './globeRoutes'

// Keeps a route's card attached to its own pill when that pill is shifted within a stack
export function popupOffset(offsetY = 0) {
  const gap = 18
  const corner = Math.round(gap / Math.SQRT2)
  return {
    center: [0, offsetY],
    top: [0, offsetY + gap],
    'top-left': [corner, offsetY + corner],
    'top-right': [-corner, offsetY + corner],
    bottom: [0, offsetY - gap],
    'bottom-left': [corner, offsetY - corner],
    'bottom-right': [-corner, offsetY - corner],
    left: [gap, offsetY],
    right: [-gap, offsetY],
  }
}

// The route's line as screen points, filled in every few pixels so a long straight
// segment still counts as crossing the card
function routeScreenPoints(map, line) {
  const points = []
  for (const part of lineParts(line)) {
    const projected = part.map((position) => map.project(position))
    projected.forEach((point, index) => {
      points.push(point)
      const next = projected[index + 1]
      if (!next) {
        return
      }
      const steps = Math.floor(Math.hypot(next.x - point.x, next.y - point.y) / 8)
      for (let step = 1; step < steps; step++) {
        const t = step / steps
        points.push({ x: point.x + (next.x - point.x) * t, y: point.y + (next.y - point.y) * t })
      }
    })
  }
  return points
}

// Where the card would sit on screen for each anchor (the anchor is the card's side touching the pill)
function cardRectForAnchor(anchor, pill, width, height, offsetY) {
  const [dx, dy] = popupOffset(offsetY)[anchor]
  const x = pill.x + dx
  const y = pill.y + dy
  const left = anchor.includes('left') ? x : anchor.includes('right') ? x - width : x - width / 2
  const top = anchor.startsWith('top') ? y : anchor.startsWith('bottom') ? y - height : y - height / 2
  return { left, top, right: left + width, bottom: top + height }
}

// Picks the side of the pill that covers the least of the route's line, preferring above the
// pill and then sides that keep the card inside the map. `line` is null until the route's line
// has downloaded, and then the card just goes above the pill if it fits.
export function anchorAwayFromRoute(map, line, lngLat, width, height, offsetY = 0) {
  const pill = map.project(lngLat)
  const points = line ? routeScreenPoints(map, line) : []
  const canvas = map.getCanvas()
  const mapWidth = canvas.clientWidth
  const mapHeight = canvas.clientHeight
  const anchors = ['bottom', 'top', 'left', 'right', 'bottom-left', 'bottom-right', 'top-left', 'top-right']

  let bestAnchor = 'bottom'
  let bestScore = Infinity
  for (const anchor of anchors) {
    const rect = cardRectForAnchor(anchor, pill, width, height, offsetY)
    const covered = points.filter(
      (point) =>
        point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom,
    ).length
    const offScreen = rect.left < 0 || rect.top < 0 || rect.right > mapWidth || rect.bottom > mapHeight
    // Going off screen is worse than covering a little of the line
    const score = covered + (offScreen ? 50 : 0)
    if (score < bestScore) {
      bestScore = score
      bestAnchor = anchor
    }
  }
  return bestAnchor
}
