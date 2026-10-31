// Decides which side of a route's pill its card opens on, so the card covers as little of the
// route's line as possible. `map` is the MapLibre map, used to turn coordinates into screen points.

import { lineParts } from './globeRoutes'

// Keeps a route's card attached to its own pill when that pill is shifted within a stack.
// The pill is centred on its trailhead, so the card is pushed out past the pill's own edges
// (pillSize is its width and height in pixels). A card that covered part of its pill would take
// the hover away from it, closing the card, which then reopens: the card would blink.
export function popupOffset(offsetY = 0, pillSize = { width: 0, height: 0 }) {
  const gap = 10
  const x = pillSize.width / 2 + gap
  const y = pillSize.height / 2 + gap
  return {
    center: [0, offsetY],
    top: [0, offsetY + y],
    'top-left': [x, offsetY + y],
    'top-right': [-x, offsetY + y],
    bottom: [0, offsetY - y],
    'bottom-left': [x, offsetY - y],
    'bottom-right': [-x, offsetY - y],
    left: [x, offsetY],
    right: [-x, offsetY],
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
function cardRectForAnchor(anchor, pill, width, height, offsetY, pillSize) {
  const [dx, dy] = popupOffset(offsetY, pillSize)[anchor]
  const x = pill.x + dx
  const y = pill.y + dy
  const left = anchor.includes('left') ? x : anchor.includes('right') ? x - width : x - width / 2
  const top = anchor.startsWith('top')
    ? y
    : anchor.startsWith('bottom')
      ? y - height
      : y - height / 2
  return { left, top, right: left + width, bottom: top + height }
}

// Picks the side of the pill that covers the least of the route's line, preferring above the
// pill and then sides that keep the card in the visible part of the map. `line` is null until the route's line
// has downloaded, and then the card just goes above the pill if it fits.
export function anchorAwayFromRoute(
  map,
  line,
  lngLat,
  width,
  height,
  offsetY = 0,
  pillSize = { width: 0, height: 0 },
) {
  const pill = map.project(lngLat)
  const points = line ? routeScreenPoints(map, line) : []
  const canvas = map.getCanvas()
  const mapWidth = canvas.clientWidth
  const mapHeight = canvas.clientHeight
  const padding = map.getPadding()
  const anchors = [
    'bottom',
    'top',
    'left',
    'right',
    'bottom-left',
    'bottom-right',
    'top-left',
    'top-right',
  ]

  let bestAnchor = 'bottom'
  let bestScore = Infinity
  for (const anchor of anchors) {
    const rect = cardRectForAnchor(anchor, pill, width, height, offsetY, pillSize)
    const covered = points.filter(
      (point) =>
        point.x >= rect.left &&
        point.x <= rect.right &&
        point.y >= rect.top &&
        point.y <= rect.bottom,
    ).length
    // The map's padding is the part covered by the navbar and the route index, so a card
    // there would be hidden behind them
    const offScreen =
      rect.left < padding.left ||
      rect.top < padding.top ||
      rect.right > mapWidth - padding.right ||
      rect.bottom > mapHeight - padding.bottom
    // Going off screen is worse than covering a little of the line
    const score = covered + (offScreen ? 50 : 0)
    if (score < bestScore) {
      bestScore = score
      bestAnchor = anchor
    }
  }
  return bestAnchor
}
