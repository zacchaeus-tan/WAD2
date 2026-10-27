// Map setup for the globe page (src/views/RoutesGlobe.vue): base map style, satellite and
// cloud layers, and the layers that draw our routes. Each function takes the MapLibre map.
//
// Third-party sources used here:
// - MapLibre GL JS (https://maplibre.org, BSD-3-Clause), the open-source map library
// - MapTiler (https://www.maptiler.com) Outdoor style, vector tiles and satellite photos, with our API key
// - CARTO basemaps (https://carto.com/basemaps) and Esri World Imagery, used when no MapTiler key is set
// - NASA GIBS Blue Marble imagery (https://earthdata.nasa.gov/gibs) and NASA's cloud picture (public/clouds.jpg)

import { difficultyColours, unratedColour } from './globeRoutes'

const maptilerKey = import.meta.env.VITE_MAPTILER_KEY

// MapTiler Outdoor shows peaks, contours, huts and trails; fall back to Carto if no key is set
export const mapStyle = maptilerKey
  ? `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${maptilerKey}`
  : 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'

// Plain land/ocean tiles for the flat-coloured globe look; both use the OpenMapTiles layer names
const baseTilesUrl = maptilerKey
  ? `https://api.maptiler.com/tiles/v3/tiles.json?key=${maptilerKey}`
  : 'https://tiles.basemaps.cartocdn.com/vector/carto.streets/v1/tiles.json'

// Raster tiles are declared at half their real pixel size so the map fetches one zoom level
// deeper than usual. That gives one image pixel per screen pixel on high-DPI (retina) screens
// instead of stretching each image pixel over four, which made the photos look blurry.
// Satellite photos for the Google Earth-style view; Esri's free imagery if no MapTiler key is set
const satelliteSource = maptilerKey
  ? {
      type: 'raster',
      url: `https://api.maptiler.com/tiles/satellite-v2/tiles.json?key=${maptilerKey}`,
      tileSize: 256,
    }
  : {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 128,
      maxzoom: 19,
      attribution: 'Imagery &copy; Esri',
    }

// NASA's Blue Marble (with sea-floor shading) for the bright, blue zoomed-out globe like Google Earth.
// Its tiles stop at zoom 8, so it fades into the sharper satellite photos above as you zoom in.
const blueMarbleSource = {
  type: 'raster',
  tiles: [
    'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg',
  ],
  tileSize: 128,
  maxzoom: 8,
  attribution: 'Imagery &copy; NASA',
}

// Turns the loaded base style into our globe: globe projection, no glow, no place names when
// zoomed out, and none of MapTiler's own trails (so only our routes are drawn in colour)
export function prepareGlobeStyle(map) {
  map.setProjection({ type: 'globe' })
  // No glow around the globe, so it sits cleanly on the background
  map.setSky({ 'atmosphere-blend': 0 })
  // Force English labels on the Carto fallback only, so MapTiler keeps its peak heights in labels
  for (const layer of maptilerKey ? [] : map.getStyle().layers) {
    const textField = layer.layout?.['text-field']
    if (layer.type === 'symbol' && JSON.stringify(textField ?? '').includes('name')) {
      map.setLayoutProperty(layer.id, 'text-field', [
        'coalesce',
        ['get', 'name_en'],
        ['get', 'name:en'],
        ['get', 'name:latin'],
      ])
    }
  }
  for (const layer of map.getStyle().layers) {
    if (layer['source-layer'] === 'trail') {
      map.setLayoutProperty(layer.id, 'visibility', 'none')
    }
    // Keep the zoomed-out globe free of place names, matching the flat-coloured look
    if (layer.type === 'symbol') {
      map.setLayerZoomRange(layer.id, Math.max(layer.minzoom ?? 0, 4), layer.maxzoom ?? 24)
    }
  }
}

// Flat green land, blue ocean and thin borders drawn over the outdoor map.
// They fade out as the user zooms in, revealing the detailed trail map underneath.
export function addGlobeBaseLayers(map) {
  const fadeOnZoom = ['interpolate', ['linear'], ['zoom'], 3, 1, 4.5, 0]
  map.addSource('globe-base', { type: 'vector', url: baseTilesUrl })
  map.addLayer({
    id: 'globe-land',
    type: 'background',
    paint: { 'background-color': '#b5d8a0', 'background-opacity': fadeOnZoom },
  })
  map.addLayer({
    id: 'globe-ocean',
    type: 'fill',
    source: 'globe-base',
    'source-layer': 'water',
    paint: { 'fill-color': '#8cc4ee', 'fill-opacity': fadeOnZoom },
  })
  map.addLayer({
    id: 'globe-borders',
    type: 'line',
    source: 'globe-base',
    'source-layer': 'boundary',
    filter: ['all', ['==', ['get', 'admin_level'], 2], ['!=', ['get', 'maritime'], 1]],
    paint: { 'line-color': '#ffffff', 'line-width': 0.6, 'line-opacity': fadeOnZoom },
  })
}

// Drawn over the map's filled areas (land, water, buildings) but under its roads, borders and
// place names, like Google Earth's labels layer. Shown or hidden by applyMapType().
// Returns the ids of the style's own layers under the satellite photos, which applyMapType() needs.
export function addSatelliteLayers(map) {
  map.addSource('satellite', satelliteSource)
  map.addSource('blue-marble', blueMarbleSource)
  const layers = map.getStyle().layers
  const areaTypes = ['background', 'fill', 'fill-extrusion', 'hillshade', 'raster']
  const lastAreaIndex = layers.findLastIndex((layer) => areaTypes.includes(layer.type))
  const firstLineLayerId = layers[lastAreaIndex + 1]?.id
  const layersUnderSatellite = layers
    .slice(0, lastAreaIndex + 1)
    .filter((layer) => layer.layout?.visibility !== 'none')
    .map((layer) => layer.id)
  map.addLayer({ id: 'satellite', type: 'raster', source: 'satellite' }, firstLineLayerId)
  map.addLayer(
    {
      id: 'blue-marble',
      type: 'raster',
      source: 'blue-marble',
      // Fully faded out by zoom 6; stopping the layer there also stops its tiles downloading,
      // so they don't hold up the satellite photos when zooming in
      maxzoom: 6,
      paint: {
        'raster-opacity': ['interpolate', ['linear'], ['zoom'], 4, 1, 6, 0],
        'raster-brightness-min': 0.14,
        'raster-saturation': 0.3,
      },
    },
    firstLineLayerId,
  )
  return layersUnderSatellite
}

// Satellite replaces the flat-coloured globe at every zoom, like Google Earth.
// Map mode keeps the flat colours.
export function applyMapType(map, showSatellite, layersUnderSatellite) {
  if (!map?.getLayer('satellite')) {
    return
  }
  for (const layerId of ['satellite', 'blue-marble', 'clouds']) {
    // The clouds load separately, so they may not be on the map yet
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', showSatellite ? 'visible' : 'none')
    }
  }
  // The satellite photos cover these completely, so turning them off also stops their data
  // (like the hillshade and contour tiles) downloading and holding up the dive onto a route
  for (const layerId of ['globe-land', 'globe-ocean', 'globe-borders', ...layersUnderSatellite]) {
    map.setLayoutProperty(layerId, 'visibility', showSatellite ? 'none' : 'visible')
  }
}

// NASA's cloud picture (public/clouds.jpg) is white clouds on black, stretched evenly from pole to
// pole. The map needs it in the Web Mercator projection with see-through gaps between clouds.
// `isSatelliteView` is checked once the picture is ready, as the user may have switched views by then.
export async function addCloudLayer(map, isSatelliteView) {
  const image = new Image()
  image.src = '/clouds.jpg'
  await image.decode()

  // Copy one row at a time into the Mercator position for that latitude
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.width
  const context = canvas.getContext('2d', { willReadFrequently: true })
  for (let y = 0; y < canvas.height; y++) {
    const mercatorY = Math.PI * (1 - (2 * (y + 0.5)) / canvas.height)
    const latitude = (Math.atan(Math.sinh(mercatorY)) * 180) / Math.PI
    const sourceY = ((90 - latitude) / 180) * image.height
    context.drawImage(image, 0, sourceY, image.width, 1, 0, y, canvas.width, 1)
  }

  // Brighter pixels are thicker cloud: make every pixel white and use its brightness as opacity
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
  for (let i = 0; i < pixels.data.length; i += 4) {
    pixels.data[i + 3] = pixels.data[i]
    pixels.data[i] = 255
    pixels.data[i + 1] = 255
    pixels.data[i + 2] = 255
  }
  context.putImageData(pixels, 0, 0)

  // The map may have been closed while the picture was loading
  if (!map.getStyle()) {
    return
  }
  const mercatorEdge = 85.051129
  map.addSource('clouds', {
    type: 'image',
    url: canvas.toDataURL(),
    coordinates: [
      [-180, mercatorEdge],
      [180, mercatorEdge],
      [180, -mercatorEdge],
      [-180, -mercatorEdge],
    ],
  })
  map.addLayer(
    {
      id: 'clouds',
      type: 'raster',
      source: 'clouds',
      maxzoom: 4.5,
      layout: { visibility: isSatelliteView() ? 'visible' : 'none' },
      // Clouds fade away as you zoom in, so they never hide the trails
      paint: { 'raster-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0.9, 4.5, 0] },
    },
    // Keep the clouds under the routes even if the routes were added first
    map.getLayer('route-casing') ? 'route-casing' : undefined,
  )
}

// Two sources for our routes: 'route-highlight' holds just the one route line on show (so
// changing it is quick), and 'route-markers' holds every route's trailhead for the pills
export function addRouteLayers(map, markerData, lineOpacity) {
  map.addSource('route-highlight', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  })
  // Markers get their own source so nearby ones can be grouped into clusters when zoomed out
  map.addSource('route-markers', {
    type: 'geojson',
    data: markerData,
    cluster: true,
    clusterRadius: 50,
    // Pills only split out at zoom 16+, where routes more than stackRadiusMetres
    // (globeRoutes.js) apart are far enough apart on screen not to overlap
    clusterMaxZoom: 15,
  })

  // Line colour by difficulty, e.g. ['match', ['get', 'difficulty'], 1, '#24883b', ..., grey]
  const colourByDifficulty = ['match', ['get', 'difficulty']]
  for (const [level, colour] of Object.entries(difficultyColours)) {
    colourByDifficulty.push(Number(level), colour)
  }
  colourByDifficulty.push(unratedColour)

  map.addLayer({
    id: 'route-casing',
    type: 'line',
    source: 'route-highlight',
    paint: {
      'line-color': '#fff7e9',
      'line-width': ['interpolate', ['linear'], ['zoom'], 0, 2, 8, 6],
      'line-opacity': lineOpacity,
      'line-opacity-transition': { duration: 1200 },
    },
  })
  map.addLayer({
    id: 'route-lines',
    type: 'line',
    source: 'route-highlight',
    paint: {
      'line-color': colourByDifficulty,
      'line-width': ['interpolate', ['linear'], ['zoom'], 0, 1, 8, 3],
      'line-opacity': lineOpacity,
      'line-opacity-transition': { duration: 1200 },
    },
  })
  map.addLayer({
    // Invisible, but MapLibre only loads (and clusters) a source when a layer uses it.
    // The visible pills are HTML markers (RoutePill.vue) placed by RoutesGlobe.vue.
    id: 'route-marker-anchors',
    type: 'circle',
    source: 'route-markers',
    paint: {
      'circle-radius': 0,
      'circle-opacity': 0,
    },
  })
}

export function showRouteLines(map) {
  for (const layerId of ['route-casing', 'route-lines']) {
    if (map.getLayer(layerId)) {
      map.setPaintProperty(layerId, 'line-opacity', 1)
    }
  }
}

// Turns dragging, zooming and rotating the globe on or off
export function setMapInteraction(map, enabled) {
  const handlers = [
    map.scrollZoom,
    map.dragPan,
    map.dragRotate,
    map.touchZoomRotate,
    map.doubleClickZoom,
    map.keyboard,
    map.boxZoom,
  ]
  for (const handler of handlers) {
    if (enabled) {
      handler.enable()
    } else {
      handler.disable()
    }
  }
}
