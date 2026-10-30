<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
// MapLibre GL JS (https://maplibre.org, BSD-3-Clause) draws the 3D globe; see src/lib/globe/globeMap.js
import { Map as MapLibreMap, Marker, Popup, ScaleControl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { motion, useReducedMotion } from 'motion-v'
import { useRouter } from 'vue-router'
import {
  fetchRouteGeometry,
  fetchRouteSummaries,
  preloadRoute,
} from '../controller/routesController'
import GlobeContours from '@/components/globe/GlobeContours.vue'
import GlobeIntro from '@/components/globe/GlobeIntro.vue'
import GlobePanel from '@/components/globe/GlobePanel.vue'
import RouteCard from '@/components/globe/RouteCard.vue'
import RoutePill from '@/components/globe/RoutePill.vue'
import {
  addCloudLayer,
  addGlobeBaseLayers,
  addRouteLayers,
  addSatelliteLayers,
  applyMapType,
  mapStyle,
  prepareGlobeStyle,
  setMapInteraction,
  walkRoute,
} from '@/lib/globe/globeMap'
import {
  assignMarkerStacks,
  countrySummaries,
  hasRenderableGeometry,
  routeBounds,
  routeCardDetails,
  routePosition,
} from '@/lib/globe/globeRoutes'
import { anchorAwayFromRoute, popupOffset } from '@/lib/globe/routeCardPlacement'

// The globe view used once the user starts exploring, centred on our routes in Southeast Asia
const exploreView = { center: [119, 4], zoom: 2.6 }
// Height of the navbar that sits over the top of the globe (--nav-height in cairn.css), and
// the width the route index takes up on the left of wide screens
const navHeightPx = 65
const indexPanelPx = 342
const introMinimumMs = 2200
// How long the camera takes to dive onto a route, the longest it then waits for the satellite
// photos to sharpen, how long the transition screen takes to fade in, the least time it stays up,
// and the longest it waits for the route's details on a slow connection
const routeDiveMs = 2400
const routeTileWaitMs = 8000
const routeScreenFadeMs = 600
const routeScreenMs = 1800
const routeLoadWaitMs = 8000
const spinDegreesPerMs = 360 / 150000
// How many map tiles can fail in one view before the user is told about it
const tileFailuresBeforeWarning = 20
const mapErrorMessage = "The globe's map couldn't load properly. Refresh the page to try again."

// Where the user was last looking, so coming back from a route's page skips the intro and lands
// in the same spot. sessionStorage works like localStorage but is cleared when the tab closes,
// so a fresh visit still gets the full intro.
const savedViewKey = 'cairn-globe-view'

function readSavedView() {
  try {
    const view = JSON.parse(sessionStorage.getItem(savedViewKey))
    return view && Array.isArray(view.center) && Number.isFinite(view.zoom) ? view : null
  } catch {
    return null
  }
}

const savedView = readSavedView()

const router = useRouter()
const globeHost = ref(null)
const routes = ref([])
const loading = ref(true)
const error = ref('')
const mapError = ref('')
// Shown when lots of map tiles fail in one view; cleared when the map next moves
const tileWarning = ref('')
// 'intro' while loading, 'hero' shows the dim spinning globe, 'explore' lets the user interact
const phase = ref('intro')
const styleReady = ref(false)
const mapReady = ref(false)
const satelliteView = ref(savedView?.satellite ?? true)
// A returning visitor has already seen the title animation, so there's nothing to wait for
const introTimeDone = ref(Boolean(savedView))
// Name of the route being opened, shown while the globe dives onto it
const openingRouteName = ref('')
const routeScreenShowing = ref(false)
// What the hover card and the clicked card show. Vue renders both cards into the hidden holder
// in the template, and the map popups display those same elements (see addRouteCardPopup).
const hoverCardRoute = ref(null)
const clickedCardRoute = ref(null)
const hoverCardElement = ref(null)
const clickedCardElement = ref(null)
// Pills on the globe: { key, element, label, coordinates } plus routeId (one route) or
// clusterId (a group). Each is drawn by <RoutePill>, teleported into its map marker's element.
const pills = ref([])
// Country the globe last flew to from the route index, highlighted there
const selectedCountry = ref('')
// What the compass and the GPS-style readout show
const mapBearing = ref(0)
const readoutPosition = ref('')
const scaleHost = ref(null)
const reduceMotion = useReducedMotion()
let introTimer
let routeDiveTimer
let spinFrame
let lastSpinTime
let touchStartY
let failedTiles = 0
let globeView
let activePopup
let hoverPopup
let clickedCardLngLat
// Route whose click card is open, so its line stays visible after the cursor leaves the pill
let pinnedRouteId = null
// Map markers for the pills on the globe, keyed like the pills (cluster-… or route-…)
let markers = new Map()
// Each route's card details (from routeCardDetails, plus its stackOffsetY), keyed by route id
let routeProperties = new Map()
// Route whose line is drawn or being downloaded to be drawn
let highlightedRouteId = null
// Stops the dot walking along the pinned route, while it is walking
let stopWalker = null
let routeFetchReady = false
let routeOverlayReady = false
let routeInteractionReady = false
// The outdoor map's own layers drawn under the satellite photos (land, water, hillshade, contours)
let layersUnderSatellite = []

const pillsVisible = computed(() => phase.value === 'explore' && !openingRouteName.value)
// The globe is dim and spinning behind the title, then clears for exploring. 'none' at the end,
// as a filter left on the map, even one that changes nothing, slows down every frame.
const dimGlobe = 'brightness(0.45) saturate(0.6)'
const globeLook = computed(() => {
  if (phase.value === 'explore') {
    return { opacity: 1, filter: 'brightness(1) saturate(1)', transitionEnd: { filter: 'none' } }
  }
  return { opacity: phase.value === 'hero' ? 1 : 0, filter: dimGlobe }
})
const routesOnGlobe = computed(() => routes.value.filter((route) => routePosition(route)))
const routesNotOnGlobe = computed(() => routes.value.filter((route) => !routePosition(route)))
const countries = computed(() => countrySummaries(routesOnGlobe.value))
// The route whose card is showing, so its pill is highlighted
const activeRouteId = computed(
  () => hoverCardRoute.value?.routeId ?? clickedCardRoute.value?.routeId ?? null,
)

// Each route's line is only downloaded the first time it's needed, then kept by route id.
// The request itself is kept too, so hovering again mid-download doesn't fetch it twice.
const routeLineRequests = new Map()
// Finished downloads: route id -> its line, or null if it has no usable line
const routeLines = new Map()

function loadRouteLine(routeId) {
  if (!routeLineRequests.has(routeId)) {
    routeLineRequests.set(routeId, downloadRouteLine(routeId))
  }
  return routeLineRequests.get(routeId)
}

async function downloadRouteLine(routeId) {
  try {
    const geometry = await fetchRouteGeometry(routeId)
    const line = hasRenderableGeometry(geometry) ? geometry : null
    routeLines.set(routeId, line)
    return line
  } catch {
    // Forget the failed download so the next hover tries again
    routeLineRequests.delete(routeId)
    return null
  }
}

function updateRouteLayer() {
  if (!globeView || !routeFetchReady) {
    return
  }

  const markerFeatures = []
  routeProperties = new Map()
  for (const route of routesOnGlobe.value) {
    const properties = routeCardDetails(route)
    routeProperties.set(route.id, properties)
    markerFeatures.push({
      type: 'Feature',
      properties,
      geometry: { type: 'Point', coordinates: routePosition(route) },
    })
  }

  // Also gives each route's properties its stackOffsetY, which its pill and card use
  assignMarkerStacks(markerFeatures)
  const markerData = { type: 'FeatureCollection', features: markerFeatures }

  if (!routeOverlayReady) {
    return
  }

  const markerSource = globeView.getSource('route-markers')
  if (markerSource) {
    markerSource.setData(markerData)
  } else {
    addRouteLayers(globeView, markerData)
  }

  if (!routeInteractionReady && globeView.getLayer('route-lines')) {
    setupRouteInteraction()
    routeInteractionReady = true
  }
}

// Only one route's line is drawn at a time: the one being hovered, or the one whose card is open.
// Pass null to clear it.
async function showRouteGeometry(routeId) {
  highlightedRouteId = routeId
  const line = routeId ? await loadRouteLine(routeId) : null
  // The cursor may have moved to another route while this line was downloading
  const source = globeView?.getSource('route-highlight')
  if (highlightedRouteId !== routeId || !source) {
    return
  }

  source.setData({
    type: 'FeatureCollection',
    features: line
      ? [{ type: 'Feature', properties: routeProperties.get(routeId), geometry: line }]
      : [],
  })

  // Only the pinned route gets a hiker, and not during the dive onto it
  stopWalker?.()
  stopWalker = null
  const shouldWalk = line && routeId === pinnedRouteId && !openingRouteName.value
  if (shouldWalk && !reduceMotion.value) {
    stopWalker = walkRoute(globeView, line)
  }
}

// The size of a route's pill on screen, so its card can open clear of it
function pillSize(routeId) {
  const pill = markers.get(`route-${routeId}`)?.getElement().firstElementChild
  return { width: pill?.offsetWidth ?? 0, height: pill?.offsetHeight ?? 0 }
}

// Adds the card once to measure it, then places it on the side away from its route
function addRouteCardPopup(options, content, properties, lngLat) {
  const pill = pillSize(properties.routeId)
  const offset = popupOffset(properties.stackOffsetY, pill)
  const measuringPopup = new Popup({ ...options, offset })
    .setLngLat(lngLat)
    .setDOMContent(content)
    .addTo(globeView)
  const { width, height } = measuringPopup.getElement().getBoundingClientRect()
  measuringPopup.remove()

  const line = routeLines.get(properties.routeId) ?? null
  const anchor = anchorAwayFromRoute(
    globeView,
    line,
    lngLat,
    width,
    height,
    properties.stackOffsetY,
    pill,
  )
  return new Popup({ ...options, offset, anchor })
    .setLngLat(lngLat)
    .setDOMContent(content)
    .addTo(globeView)
}

async function showHoverPopup(properties, lngLat) {
  hoverCardRoute.value = properties
  // Wait for Vue to fill in the card, as the popup measures it to choose a side
  await nextTick()
  // The cursor may have left the pill already
  if (hoverCardRoute.value?.routeId !== properties.routeId) {
    return
  }

  hoverPopup?.remove()
  // is-preview lets the cursor pass through the card, so it can never take the hover from its pill
  hoverPopup = addRouteCardPopup(
    {
      className: 'route-card-popup is-preview',
      closeButton: false,
      closeOnClick: false,
      maxWidth: '380px',
    },
    hoverCardElement.value,
    properties,
    lngLat,
  )
}

function hideHoverPopup() {
  hoverPopup?.remove()
  hoverPopup = null
  hoverCardRoute.value = null
}

async function showRoutePopup(properties, lngLat) {
  hideHoverPopup()
  clickedCardRoute.value = properties
  clickedCardLngLat = lngLat
  // Wait for Vue to fill in the card, as the popup measures it to choose a side
  await nextTick()
  // Another route may have been clicked in the meantime
  if (clickedCardRoute.value?.routeId !== properties.routeId) {
    return
  }

  // Cleared first, so the old card's close handler knows it is being replaced, not closed
  const previousPopup = activePopup
  activePopup = null
  previousPopup?.remove()
  pinnedRouteId = properties.routeId
  showRouteGeometry(pinnedRouteId)

  // A phone is too narrow for the card beside or above a pill, so the globe first moves the
  // pill up under the navbar and the card then hangs below it
  if (isPhone()) {
    await movePillNearTop(lngLat, properties.stackOffsetY)
    if (clickedCardRoute.value?.routeId !== properties.routeId) {
      return
    }
  }

  // Stays open (keeping its route highlighted) until the user clicks the card's close button
  const popup = addRouteCardPopup(
    {
      className: 'route-card-popup',
      closeButton: false,
      closeOnClick: false,
      maxWidth: '380px',
    },
    clickedCardElement.value,
    properties,
    lngLat,
  )
  // Hide this route's line again once its card closes
  popup.on('close', () => {
    if (pinnedRouteId === properties.routeId) {
      pinnedRouteId = null
      showRouteGeometry(null)
    }
    // Only when the user closed this card; a card replacing it has already cleared activePopup
    if (activePopup === popup) {
      activePopup = null
      clickedCardRoute.value = null
    }
  })
  activePopup = popup
}

// Glides the globe so a pill sits just under the navbar, and waits until it has
function movePillNearTop(lngLat, offsetY = 0) {
  return new Promise((resolve) => {
    const padding = globeView.getPadding()
    const mapHeight = globeView.getCanvas().clientHeight
    const middleY = (padding.top + mapHeight - padding.bottom) / 2
    // Listen first: with no animation, easeTo finishes (and fires moveend) straight away
    globeView.once('moveend', resolve)
    globeView.easeTo({
      center: lngLat,
      offset: [0, padding.top + 72 - offsetY - middleY],
      duration: reduceMotion.value ? 0 : 500,
    })
  })
}

// Flies the camera down onto the route, shows the transition screen, then opens its details page
async function openRouteDetails(properties, lngLat) {
  if (openingRouteName.value) {
    return
  }

  const detailsPage = { name: 'route-detail', params: { id: properties.routeId } }
  if (!globeView || reduceMotion.value) {
    router.push(detailsPage)
    return
  }

  openingRouteName.value = properties.name
  // Started now, so the details are usually ready by the time the dive ends
  const routeLoaded = Promise.race([
    preloadRoute(properties.routeId),
    new Promise((resolve) => setTimeout(resolve, routeLoadWaitMs)),
  ])
  setMapInteraction(globeView, false)
  hideHoverPopup()
  // Closing the card unpins its line, so pin it again to keep it drawn during the dive
  activePopup?.remove()
  activePopup = null
  pinnedRouteId = properties.routeId
  showRouteGeometry(pinnedRouteId)

  // Frame the whole route if it has a line (usually already downloaded when its card opened),
  // otherwise zoom in on its pill
  const line = await loadRouteLine(properties.routeId)
  // The user may have left the page while the line was downloading
  if (!globeView) {
    return
  }
  let camera = { center: lngLat, zoom: 13 }
  if (line) {
    camera = globeView.cameraForBounds(routeBounds(line), { padding: 80, maxZoom: 12 }) ?? camera
  }

  // Zooming deeper or tilting further makes the map fetch far more satellite tiles
  globeView.flyTo({
    center: camera.center,
    zoom: Math.min(camera.zoom, 13),
    pitch: 45,
    bearing: 25,
    duration: routeDiveMs,
    essential: true,
  })
  globeView.once('moveend', () => showScreenWhenSharp(detailsPage, routeLoaded))
}

function openClickedRoute() {
  openRouteDetails(clickedCardRoute.value, clickedCardLngLat)
}

// Its close handler clears activePopup and the card
function closeClickedCard() {
  activePopup?.remove()
}

// Waits on the route until its satellite photos have finished loading (or for a few seconds
// on a slow connection), then shows the transition screen until the route's details have loaded
// and opens the details page. The screen stays up while the page's code downloads too, as the
// router only leaves this page once that's done.
function showScreenWhenSharp(detailsPage, routeLoaded) {
  let screenShown = false
  function showScreen() {
    if (screenShown) {
      return
    }
    screenShown = true
    clearTimeout(routeDiveTimer)
    routeScreenShowing.value = true
    routeDiveTimer = setTimeout(async () => {
      await routeLoaded
      // The user may have gone back while the details were loading
      if (globeView) {
        router.push(detailsPage)
      }
    }, routeScreenMs)
  }

  // 'idle' fires once every tile on screen has loaded and faded in
  globeView.once('idle', showScreen)
  routeDiveTimer = setTimeout(showScreen, routeTileWaitMs)
}

function onPillEnter(pill) {
  showHoverPopup(routeProperties.get(pill.routeId), pill.coordinates)
  showRouteGeometry(pill.routeId)
}

function onPillLeave() {
  hideHoverPopup()
  showRouteGeometry(pinnedRouteId)
}

function onPillClick(pill) {
  showRoutePopup(routeProperties.get(pill.routeId), pill.coordinates)
}

async function zoomIntoCluster(pill) {
  const zoom = await globeView.getSource('route-markers').getClusterExpansionZoom(pill.clusterId)
  globeView.easeTo({ center: pill.coordinates, zoom })
}

// Show clusters as "N routes" pills and single routes as distance pills, adding new ones and
// removing ones that have merged or split up. Runs every time the map redraws.
function updatePills() {
  if (!globeView.getSource('route-markers') || !globeView.isSourceLoaded('route-markers')) {
    return
  }

  const nextMarkers = new Map()
  const newPills = []
  for (const feature of globeView.querySourceFeatures('route-markers')) {
    const { cluster, cluster_id: clusterId, point_count: routeCount, routeId } = feature.properties
    const key = cluster ? `cluster-${clusterId}` : `route-${routeId}`
    if (nextMarkers.has(key)) {
      continue
    }
    if (markers.has(key)) {
      nextMarkers.set(key, markers.get(key))
      continue
    }

    // An empty element for the map to position; the pill itself is teleported into it
    const element = document.createElement('div')
    const coordinates = feature.geometry.coordinates
    const properties = cluster ? null : routeProperties.get(routeId)
    const marker = new Marker({ element, offset: [0, properties?.stackOffsetY ?? 0] })
      .setLngLat(coordinates)
      .addTo(globeView)
    nextMarkers.set(key, marker)

    if (cluster) {
      newPills.push({ key, element, coordinates, clusterId, label: String(routeCount) })
    } else {
      newPills.push({
        key,
        element,
        coordinates,
        routeId,
        label: properties.shortName,
        name: properties.name,
        grade: properties.difficulty,
        difficultyLabel: properties.difficultyLabel,
      })
      // Start downloading the line now, so it's usually ready by the time the pill is hovered
      loadRouteLine(routeId)
    }
  }

  let removedAny = false
  for (const [key, marker] of markers) {
    // A pinned card hangs off its pill, which the map may stop listing near the edge of the globe
    if (!nextMarkers.has(key) && key === `route-${pinnedRouteId}`) {
      nextMarkers.set(key, marker)
    }
    if (!nextMarkers.has(key)) {
      // A removed pill never fires mouseleave, so close its hover card here
      if (marker.getElement().matches(':hover')) {
        onPillLeave()
      }
      marker.remove()
      removedAny = true
    }
  }
  markers = nextMarkers

  // This runs on every frame, so only update the pill list when something actually changed
  if (newPills.length || removedAny) {
    pills.value = [...pills.value.filter((pill) => markers.has(pill.key)), ...newPills]
  }
}

function setupRouteInteraction() {
  globeView.on('render', updatePills)
  // Zooming or panning moves the pill out from under the cursor, so close any hover card
  globeView.on('movestart', hideHoverPopup)
  globeView.on('click', 'route-lines', (event) => {
    const routeId = event.features?.[0]?.properties.routeId
    if (routeId) {
      showRoutePopup(routeProperties.get(routeId), event.lngLat)
    }
  })
  globeView.on('mouseenter', 'route-lines', () => {
    globeView.getCanvas().style.cursor = 'pointer'
  })
  globeView.on('mouseleave', 'route-lines', () => {
    globeView.getCanvas().style.cursor = ''
  })
}

watch(satelliteView, (showSatellite) => {
  applyMapType(globeView, showSatellite, layersUnderSatellite)
  saveView()
})

function saveView() {
  // Not during the dive, so coming back lands where the user clicked rather than zoomed in on the route
  if (phase.value !== 'explore' || openingRouteName.value) {
    return
  }

  const center = globeView.getCenter()
  const view = {
    center: [center.lng, center.lat],
    zoom: globeView.getZoom(),
    bearing: globeView.getBearing(),
    pitch: globeView.getPitch(),
    satellite: satelliteView.value,
  }
  try {
    sessionStorage.setItem(savedViewKey, JSON.stringify(view))
  } catch {
    // Storage is blocked (e.g. some private windows): the globe just won't remember the view
  }
}

// Turn the globe a little each frame, east to west like the real Earth
function spinGlobe(time) {
  if (lastSpinTime != null) {
    const center = globeView.getCenter()
    center.lng -= (time - lastSpinTime) * spinDegreesPerMs
    globeView.jumpTo({ center: center.wrap() })
  }
  lastSpinTime = time
  spinFrame = requestAnimationFrame(spinGlobe)
}

function stopSpinning() {
  cancelAnimationFrame(spinFrame)
  spinFrame = null
  lastSpinTime = null
}

function showHero() {
  phase.value = 'hero'
  if (globeView && !reduceMotion.value) {
    spinFrame = requestAnimationFrame(spinGlobe)
  }
}

function startExploring() {
  if (phase.value !== 'hero') {
    return
  }

  phase.value = 'explore'
  stopSpinning()
  if (!globeView) {
    return
  }

  // Only hand control to the user once the globe has settled on the routes
  globeView.once('moveend', () => setMapInteraction(globeView, true))
  globeView.easeTo({
    ...exploreView,
    padding: globePadding(),
    duration: reduceMotion.value ? 0 : 2000,
  })
}

// Coming back to the globe: skip the hero screen and carry on exploring from the saved view
function resumeExploring() {
  phase.value = 'explore'
  if (globeView) {
    globeView.setPadding(globePadding())
    setMapInteraction(globeView, true)
  }
}

// Keeps the globe centred in the space the navbar and route index leave free. On phones the
// index is a bar along the bottom instead of a panel on the left.
// Same width as the phone layout in GlobePanel.vue
function isPhone() {
  return window.matchMedia('(max-width: 640px)').matches
}

function globePadding() {
  if (isPhone()) {
    return { top: navHeightPx, bottom: 52, left: 0, right: 0 }
  }
  return { top: navHeightPx, bottom: 0, left: indexPanelPx, right: 0 }
}

function closeRouteCards() {
  hideHoverPopup()
  closeClickedCard()
}

// Fits all of a country's trailheads on screen
function flyToCountry(countryName) {
  const country = countries.value.find((item) => item.name === countryName)
  if (!country || !globeView) {
    return
  }

  selectedCountry.value = countryName
  closeRouteCards()
  globeView.fitBounds(country.bounds, {
    padding: 60,
    maxZoom: 8,
    duration: reduceMotion.value ? 0 : 1600,
  })
}

// Keeps the compass pointing north and the readout on the middle of the view
function updateInstruments() {
  mapBearing.value = globeView.getBearing()
  const { lat, lng } = globeView.getCenter().wrap()
  const latitude = `${lat >= 0 ? 'N' : 'S'} ${Math.abs(lat).toFixed(2)}°`
  const longitude = `${lng >= 0 ? 'E' : 'W'} ${Math.abs(lng).toFixed(2)}°`
  readoutPosition.value = `${latitude} ${longitude}`
}

function zoomIn() {
  globeView?.zoomIn()
}

function zoomOut() {
  globeView?.zoomOut()
}

// Back to the starting view of all the routes
function resetView() {
  selectedCountry.value = ''
  closeRouteCards()
  globeView?.easeTo({
    ...exploreView,
    bearing: 0,
    pitch: 0,
    duration: reduceMotion.value ? 0 : 1400,
  })
}

// Any downward scroll, swipe up or "next" key on the hero screen starts exploring
function onWheel(event) {
  if (event.deltaY > 0) {
    startExploring()
  }
}

function onTouchStart(event) {
  touchStartY = event.touches[0].clientY
}

function onTouchMove(event) {
  if (touchStartY - event.touches[0].clientY > 40) {
    startExploring()
  }
}

function onKeydown(event) {
  if (phase.value === 'hero' && ['ArrowDown', 'PageDown', ' ', 'Enter'].includes(event.key)) {
    event.preventDefault()
    startExploring()
  }
}

// The steps the intro loading bar fills up with; a failed step counts as done so the bar still finishes
const loadingSteps = computed(() => [
  { label: 'Building the globe', done: styleReady.value || Boolean(mapError.value) },
  { label: 'Fetching routes', done: !loading.value },
  { label: 'Loading map imagery', done: mapReady.value || Boolean(mapError.value) },
])

const readyMessage = computed(() =>
  error.value ? 'Ready' : `Ready: ${routes.value.length} routes found`,
)

// Leave the intro once routes and globe are ready and the title animation has had time to play
watch([loading, mapReady, mapError, introTimeDone], () => {
  const globeSettled = mapReady.value || Boolean(mapError.value)
  if (phase.value === 'intro' && !loading.value && globeSettled && introTimeDone.value) {
    if (savedView) {
      resumeExploring()
    } else {
      showHero()
    }
  }
})

// One tile failing to download only leaves a small patch the map fills with a blurrier version,
// so it isn't worth interrupting the user. Lots failing in one view means the imagery is down,
// and a blank map with no explanation would be worse. Details go to the console, as the design
// system says never to show raw server errors.
function onMapError(event) {
  console.warn('Globe map error:', event.error)
  if (!event.tile) {
    mapError.value = mapErrorMessage
    return
  }

  failedTiles++
  if (failedTiles >= tileFailuresBeforeWarning) {
    tileWarning.value =
      "Some map imagery couldn't load, so parts of the map may be blurry or blank."
  }
}

onMounted(async () => {
  if (!introTimeDone.value) {
    introTimer = setTimeout(() => {
      introTimeDone.value = true
    }, introMinimumMs)
  }
  window.addEventListener('keydown', onKeydown)

  try {
    globeView = new MapLibreMap({
      container: globeHost.value,
      style: mapStyle,
      center: savedView?.center ?? [20, 15],
      zoom: savedView?.zoom ?? 1.4,
      bearing: savedView?.bearing ?? 0,
      pitch: savedView?.pitch ?? 0,
      pixelRatio: Math.max(window.devicePixelRatio || 1, 2),
    })
    setMapInteraction(globeView, false)
    globeView.on('moveend', saveView)
    globeView.on('move', updateInstruments)
    updateInstruments()
    // The scale bar goes in the readout rather than in one of the map's own corners
    const scaleControl = new ScaleControl({ maxWidth: 90, unit: 'metric' })
    scaleHost.value.append(scaleControl.onAdd(globeView))
    globeView.on('error', onMapError)
    globeView.on('movestart', () => {
      failedTiles = 0
      tileWarning.value = ''
    })
    globeView.once('load', () => {
      mapReady.value = true
    })
    globeView.once('style.load', () => {
      prepareGlobeStyle(globeView)
      layersUnderSatellite = addSatelliteLayers(globeView)
      addGlobeBaseLayers(globeView)
      applyMapType(globeView, satelliteView.value, layersUnderSatellite)
      addCloudLayer(globeView, () => satelliteView.value)
      routeOverlayReady = true
      updateRouteLayer()
      styleReady.value = true
    })
  } catch (err) {
    console.error(err)
    mapError.value = mapErrorMessage
  }

  try {
    routes.value = await fetchRouteSummaries()
    routeFetchReady = true
    updateRouteLayer()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    error.value = `Unable to load routes: ${message}`
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  clearTimeout(introTimer)
  clearTimeout(routeDiveTimer)
  stopSpinning()
  window.removeEventListener('keydown', onKeydown)
  stopWalker?.()
  globeView?.remove()
  // Lets route lines that finish downloading after the page closes see there's no map to draw on
  globeView = null
})
</script>

<template>
  <div
    class="globe-page"
    @wheel.passive="onWheel"
    @touchstart.passive="onTouchStart"
    @touchmove.passive="onTouchMove"
  >
    <GlobeContours />

    <motion.div
      class="globe-surface"
      :initial="{ opacity: 0, filter: dimGlobe }"
      :animate="globeLook"
      :transition="{ duration: reduceMotion ? 0 : 1.5, ease: 'easeInOut' }"
    >
      <div
        ref="globeHost"
        class="globe-map"
        role="region"
        aria-label="Interactive globe"
        aria-roledescription="3D globe"
      ></div>
    </motion.div>

    <GlobeIntro
      :phase="phase"
      :loading-steps="loadingSteps"
      :ready-message="readyMessage"
      @explore="startExploring"
    />

    <GlobePanel
      v-if="phase === 'explore'"
      v-model:satellite="satelliteView"
      :route-count="routes.length"
      :shown-count="routesOnGlobe.length"
      :missing-routes="routesNotOnGlobe"
      :countries="countries"
      :selected-country="selectedCountry"
      :error="error"
      :map-error="mapError || tileWarning"
      @fly-to="flyToCountry"
    />

    <!-- A compass that really follows the map, and zoom buttons -->
    <motion.div
      v-if="phase === 'explore'"
      class="globe-camera"
      role="group"
      aria-label="Camera"
      :initial="{ opacity: 0 }"
      :animate="{ opacity: 1 }"
      :transition="{ duration: reduceMotion ? 0 : 0.6, delay: reduceMotion ? 0 : 0.4 }"
    >
      <button
        type="button"
        class="globe-compass"
        aria-label="Face north and go back to all routes"
        data-testid="globe-reset-view"
        @click="resetView"
      >
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="30" fill="#fbfaf7" stroke="#17201c" stroke-width="3" />
          <g :transform="`rotate(${-mapBearing} 32 32)`">
            <path d="M32 7v6M32 51v6M7 32h6M51 32h6" stroke="#17201c" stroke-width="2" />
            <path d="M32 13 39 32H25z" fill="#c2481a" />
            <path d="M32 51 25 32h14z" fill="#3a4540" />
          </g>
          <circle cx="32" cy="32" r="3" fill="#fbfaf7" stroke="#17201c" stroke-width="1.5" />
        </svg>
      </button>
      <div class="globe-zoom">
        <button type="button" aria-label="Zoom in" data-testid="globe-zoom-in" @click="zoomIn">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <button type="button" aria-label="Zoom out" data-testid="globe-zoom-out" @click="zoomOut">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14" />
          </svg>
        </button>
      </div>
    </motion.div>

    <!-- Where the camera is, like the readout on a GPS unit, with the map's scale bar added to it.
         Always in the page, as the scale bar is added when the map is created. -->
    <motion.div
      class="globe-readout"
      aria-hidden="true"
      :initial="{ opacity: 0 }"
      :animate="{ opacity: phase === 'explore' ? 1 : 0 }"
      :transition="{ duration: reduceMotion ? 0 : 0.6, delay: reduceMotion ? 0 : 0.4 }"
    >
      <span class="cairn-data">{{ readoutPosition }}</span>
      <div ref="scaleHost"></div>
    </motion.div>

    <!-- Each pill is rendered here but teleported into its map marker, which the map keeps
         positioned over the route's trailhead as the globe moves -->
    <template v-for="pill in pills" :key="pill.key">
      <Teleport :to="pill.element">
        <RoutePill
          v-if="pill.routeId"
          :label="pill.label"
          :grade="pill.grade"
          :is-visible="pillsVisible"
          :class="{ 'is-active': pill.routeId === activeRouteId }"
          :title="pill.name"
          :aria-label="`${pill.name}, ${pill.difficultyLabel}`"
          data-testid="route-pill"
          @mouseenter="onPillEnter(pill)"
          @mouseleave="onPillLeave"
          @focus="onPillEnter(pill)"
          @blur="onPillLeave"
          @click.stop="onPillClick(pill)"
        />
        <RoutePill
          v-else
          :label="pill.label"
          is-group
          :is-visible="pillsVisible"
          :aria-label="`${pill.label} routes here, zoom in`"
          data-testid="route-cluster-pill"
          @click="zoomIntoCluster(pill)"
        />
      </Teleport>
    </template>

    <!-- The route cards. Vue keeps them up to date here, and the map popups show these same
         elements, so they stay hidden until a popup takes them -->
    <div class="d-none">
      <div ref="hoverCardElement">
        <RouteCard v-if="hoverCardRoute" :route="hoverCardRoute" />
      </div>
      <div ref="clickedCardElement">
        <RouteCard
          v-if="clickedCardRoute"
          :route="clickedCardRoute"
          show-view-more
          @view-more="openClickedRoute"
          @close="closeClickedCard"
        />
      </div>
    </div>

    <!-- Covers the globe during the dive so nothing can be clicked, then the transition screen
         fades in over it -->
    <div v-if="openingRouteName" class="globe-route-dive">
      <motion.div
        class="cairn globe-route-screen"
        role="status"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: routeScreenShowing ? 1 : 0 }"
        :transition="{ duration: routeScreenFadeMs / 1000, ease: [0.16, 1, 0.3, 1] }"
      >
        <p class="cairn-label">Heading to the trailhead</p>
        <p class="globe-route-screen-name">{{ openingRouteName }}</p>
        <svg
          class="globe-route-screen-trail"
          viewBox="0 0 400 20"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M4 12C70 2 120 18 190 10S320 4 396 12" />
        </svg>
      </motion.div>
    </div>
  </div>
</template>

<style scoped>
/* Fills the whole screen, under the see-through navbar. Night is the base under the globe,
   like under every dimmed photo in CAIRN. */
.globe-page {
  position: relative;
  height: 100dvh;
  min-height: 480px;
  overflow: hidden;
  background: var(--night);
  color: var(--ground);
}

/* Darkens the top of the screen so the navbar's paper text always reads over the globe */
.globe-page::after {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  z-index: 1;
  height: 160px;
  background: linear-gradient(rgb(16 24 20 / 0.7), transparent);
  pointer-events: none;
}

.globe-surface,
.globe-map {
  position: absolute;
  inset: 0;
}

/* MapLibre builds the popup frame around our RouteCard, so its parts need :deep().
   The frame is invisible: the card is its own page, with its own shadow. */
.globe-surface :deep(.route-card-popup .maplibregl-popup-content) {
  padding: 0;
  border-radius: 0;
  background: none;
  box-shadow: none;
}

.globe-surface :deep(.route-card-popup .maplibregl-popup-tip) {
  display: none;
}

/* The hover card has nothing to click, so the cursor passes through it */
.globe-surface :deep(.route-card-popup.is-preview) {
  pointer-events: none;
}

/* The compass and zoom buttons, bottom right */
.globe-camera {
  position: absolute;
  right: var(--gutter);
  bottom: 40px;
  z-index: 3;
  display: grid;
  justify-items: center;
  gap: 10px;
}

.globe-compass {
  width: 60px;
  height: 60px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  cursor: pointer;
  filter: drop-shadow(0 4px 8px rgb(0 0 0 / 0.45));
}

.globe-compass:focus-visible {
  outline: 3px solid var(--glacier);
  outline-offset: 3px;
}

.globe-zoom {
  display: grid;
  background: var(--ground);
  box-shadow: var(--shadow-panel);
}

.globe-zoom button {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-bottom: 1px solid var(--granite-200);
  background: none;
  color: var(--ink);
  cursor: pointer;
}

.globe-zoom button:last-child {
  border-bottom: 0;
}

.globe-zoom button:hover {
  background: var(--paper);
}

.globe-zoom button:focus-visible {
  outline: 3px solid var(--glacier);
  outline-offset: 2px;
}

.globe-zoom svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}

/* Bottom left, just past the board */
.globe-readout {
  position: absolute;
  bottom: 14px;
  left: calc(var(--gutter) + 332px);
  z-index: 2;
  display: flex;
  align-items: flex-end;
  gap: 14px;
  padding: 5px 10px;
  background: rgb(16 24 20 / 0.72);
  color: var(--lichen);
  font-size: 11px;
  line-height: 1.2;
}

.globe-readout :deep(.maplibregl-ctrl-scale) {
  margin: 0;
  padding: 0 4px;
  border: 2px solid var(--lichen);
  border-top: 0;
  background: none;
  color: var(--lichen);
  font: 600 10px var(--font-data);
  white-space: nowrap;
}

/* Above the navbar (z-index 20 in SiteNav.vue), as the screen covers the whole page */
.globe-route-dive {
  position: absolute;
  inset: 0;
  z-index: 30;
}

/* Fades its opacity rather than its colour, so the browser can blend it without repainting
   the whole screen on every frame */
.globe-route-screen {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 12px;
  padding: 0 var(--gutter);
  background: var(--night);
  color: var(--ground);
  text-align: center;
}

.globe-route-screen .cairn-label {
  color: var(--lichen);
}

.globe-route-screen-name {
  max-width: 14ch;
  font-size: clamp(36px, 6vw, 88px);
  font-weight: 900;
  line-height: 0.95;
  letter-spacing: -0.03em;
  text-wrap: balance;
}

.globe-route-screen-trail {
  width: min(420px, 80vw);
  height: 20px;
}

.globe-route-screen-trail path {
  fill: none;
  stroke: var(--wood-light);
  stroke-width: 3;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}

/* On phones the route index is a bar along the bottom, so the camera buttons and the map's
   credit sit above it, side by side, and there is no room for the readout */
@media (max-width: 640px) {
  .globe-camera {
    right: 12px;
    bottom: 68px;
  }

  .globe-surface :deep(.maplibregl-ctrl-bottom-right) {
    right: 64px;
    bottom: 52px;
  }

  .globe-compass {
    width: 52px;
    height: 52px;
  }

  .globe-readout {
    display: none;
  }
}
</style>
