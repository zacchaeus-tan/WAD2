<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
// MapLibre GL JS (https://maplibre.org, BSD-3-Clause) draws the 3D globe; see src/lib/globe/globeMap.js
import { Map as MapLibreMap, Marker, Popup } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useRouter } from 'vue-router'
import { fetchRouteGeometry, fetchRouteSummaries } from '../controller/routesController'
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
  showRouteLines,
} from '@/lib/globe/globeMap'
import {
  assignMarkerStacks,
  difficultyColour,
  hasRenderableGeometry,
  routeBounds,
  routeCardDetails,
  routePosition,
} from '@/lib/globe/globeRoutes'
import { anchorAwayFromRoute, popupOffset } from '@/lib/globe/routeCardPlacement'

// The globe view used once the user starts exploring, centred on our routes in Southeast Asia
const exploreView = { center: [119, 9], zoom: 2.5 }
const introMinimumMs = 2200
// How long the camera takes to dive onto a route, the longest it then waits for the satellite
// photos to sharpen, and how long the fade to black takes (matches .globe-route-dive::before)
const routeDiveMs = 2400
const routeTileWaitMs = 8000
const routeFadeMs = 600
const spinDegreesPerMs = 360 / 150000

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
// 'intro' while loading, 'hero' shows the dim spinning globe, 'explore' lets the user interact
const phase = ref('intro')
const styleReady = ref(false)
const mapReady = ref(false)
const satelliteView = ref(savedView?.satellite ?? true)
// A returning visitor has already seen the title animation, so there's nothing to wait for
const introTimeDone = ref(Boolean(savedView))
// Name of the route being opened, shown while the globe dives onto it
const openingRouteName = ref('')
const routeDiveFading = ref(false)
// What the hover card and the clicked card show. Vue renders both cards into the hidden holder
// in the template, and the map popups display those same elements (see addRouteCardPopup).
const hoverCardRoute = ref(null)
const clickedCardRoute = ref(null)
const hoverCardElement = ref(null)
const clickedCardElement = ref(null)
// Pills on the globe: { key, element, label, coordinates } plus routeId (one route) or
// clusterId (a group). Each is drawn by <RoutePill>, teleported into its map marker's element.
const pills = ref([])
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
let introTimer
let routeDiveTimer
let spinFrame
let lastSpinTime
let touchStartY
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
let routeFetchReady = false
let routeOverlayReady = false
let routeInteractionReady = false
// The outdoor map's own layers drawn under the satellite photos (land, water, hillshade, contours)
let layersUnderSatellite = []

const routesOnGlobe = computed(() => routes.value.filter((route) => routePosition(route)))
const routesNotOnGlobe = computed(() => routes.value.filter((route) => !routePosition(route)))

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
    addRouteLayers(globeView, markerData, routeLineOpacity())
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
    features: line ? [{ type: 'Feature', properties: routeProperties.get(routeId), geometry: line }] : [],
  })
}

// Adds the card once to measure it, then places it on the side away from its route
function addRouteCardPopup(options, content, properties, lngLat) {
  const measuringPopup = new Popup(options).setLngLat(lngLat).setDOMContent(content).addTo(globeView)
  const { width, height } = measuringPopup.getElement().getBoundingClientRect()
  measuringPopup.remove()

  const line = routeLines.get(properties.routeId) ?? null
  const anchor = anchorAwayFromRoute(globeView, line, lngLat, width, height, properties.stackOffsetY)
  return new Popup({ ...options, anchor }).setLngLat(lngLat).setDOMContent(content).addTo(globeView)
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
  hoverPopup = addRouteCardPopup(
    {
      className: 'route-card-popup',
      closeButton: false,
      closeOnClick: false,
      maxWidth: '380px',
      offset: popupOffset(properties.stackOffsetY),
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

  activePopup?.remove()
  pinnedRouteId = properties.routeId
  showRouteGeometry(pinnedRouteId)
  // Stays open (keeping its route highlighted) until the user clicks its close button
  const popup = addRouteCardPopup(
    {
      className: 'route-card-popup',
      closeOnClick: false,
      maxWidth: '380px',
      offset: popupOffset(properties.stackOffsetY),
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
  })
  activePopup = popup
}

// Flies the camera down onto the route, fades to black, then opens its details page
async function openRouteDetails(properties, lngLat) {
  if (openingRouteName.value) {
    return
  }

  const detailsPage = { name: 'route-detail', params: { id: properties.routeId } }
  if (!globeView || prefersReducedMotion) {
    router.push(detailsPage)
    return
  }

  openingRouteName.value = properties.name
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
  globeView.once('moveend', () => fadeOutWhenSharp(detailsPage))
}

function openClickedRoute() {
  openRouteDetails(clickedCardRoute.value, clickedCardLngLat)
}

// Waits on the route until its satellite photos have finished loading (or for a few seconds
// on a slow connection), then fades to black and opens the details page
function fadeOutWhenSharp(detailsPage) {
  let fading = false
  function fadeOut() {
    if (fading) {
      return
    }
    fading = true
    clearTimeout(routeDiveTimer)
    routeDiveFading.value = true
    routeDiveTimer = setTimeout(() => router.push(detailsPage), routeFadeMs)
  }

  // 'idle' fires once every tile on screen has loaded and faded in
  globeView.once('idle', fadeOut)
  routeDiveTimer = setTimeout(fadeOut, routeTileWaitMs)
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
      newPills.push({ key, element, coordinates, clusterId, label: `${routeCount} routes` })
    } else {
      newPills.push({
        key,
        element,
        coordinates,
        routeId,
        label: properties.distanceLabel,
        dotColour: difficultyColour(properties.difficulty),
      })
      // Start downloading the line now, so it's usually ready by the time the pill is hovered
      loadRouteLine(routeId)
    }
  }

  let removedAny = false
  for (const [key, marker] of markers) {
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

function routeLineOpacity() {
  return phase.value === 'explore' ? 1 : 0
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
  if (globeView && !prefersReducedMotion) {
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

  showRouteLines(globeView)
  // Only hand control to the user once the globe has settled on the routes
  globeView.once('moveend', () => setMapInteraction(globeView, true))
  globeView.easeTo({ ...exploreView, duration: prefersReducedMotion ? 0 : 2000 })
}

// Coming back to the globe: skip the hero screen and carry on exploring from the saved view
function resumeExploring() {
  phase.value = 'explore'
  if (globeView) {
    showRouteLines(globeView)
    setMapInteraction(globeView, true)
  }
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
    globeView.on('error', (event) => {
      if (event.error) {
        mapError.value = `Globe rendering error: ${event.error.message}`
      }
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
    const message = err instanceof Error ? err.message : String(err)
    mapError.value = `Unable to initialize the globe: ${message}`
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
  globeView?.remove()
  // Lets route lines that finish downloading after the page closes see there's no map to draw on
  globeView = null
})
</script>

<template>
  <div
    class="globe-page"
    :class="[`is-${phase}`, { 'is-satellite': satelliteView }]"
    @wheel.passive="onWheel"
    @touchstart.passive="onTouchStart"
    @touchmove.passive="onTouchMove"
  >
    <div
      ref="globeHost"
      class="globe-surface"
      role="region"
      aria-label="Interactive globe"
      aria-roledescription="3D globe"
    ></div>

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
      :error="error"
      :map-error="mapError"
    />

    <!-- Each pill is rendered here but teleported into its map marker, which the map keeps
         positioned over the route's trailhead as the globe moves -->
    <template v-for="pill in pills" :key="pill.key">
      <Teleport :to="pill.element">
        <RoutePill
          v-if="pill.routeId"
          :label="pill.label"
          :dot-colour="pill.dotColour"
          data-testid="route-pill"
          @mouseenter="onPillEnter(pill)"
          @mouseleave="onPillLeave"
          @click.stop="onPillClick(pill)"
        />
        <RoutePill
          v-else
          :label="pill.label"
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
        />
      </div>
    </div>

    <!-- Covers the globe during the dive so nothing can be clicked, then fades to black -->
    <div
      v-if="openingRouteName"
      class="globe-route-dive"
      :class="{ 'is-fading': routeDiveFading }"
      role="status"
    >
      <p class="globe-route-dive-label">
        Heading to <strong>{{ openingRouteName }}</strong>
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Fills the screen below the site header; the three phases are driven by the is-* class */
.globe-page {
  position: relative;
  height: calc(100dvh - 4rem - 1px);
  min-height: 480px;
  overflow: hidden;
  background: #2a2a2a;
  color: #ffffff;
  transition: background-color 1.5s ease;
}

.globe-page.is-explore {
  background: #000000;
}

/* Scattered stars behind the satellite globe. Each layer of dots repeats at a different
   size so the pattern doesn't look like a grid. */
.globe-page.is-explore.is-satellite {
  background-image:
    radial-gradient(1px 1px at 20px 30px, #ffffff, transparent),
    radial-gradient(1px 1px at 140px 90px, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1.5px 1.5px at 230px 170px, #ffffff, transparent),
    radial-gradient(1px 1px at 310px 40px, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(1px 1px at 90px 240px, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(1.5px 1.5px at 270px 280px, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1px 1px at 360px 200px, rgba(255, 255, 255, 0.4), transparent);
  background-size:
    380px 320px,
    430px 390px,
    510px 470px,
    350px 410px,
    460px 350px,
    560px 520px,
    400px 440px;
}

.globe-surface {
  position: absolute;
  inset: 0;
  opacity: 0;
  filter: brightness(0.45) saturate(0.6);
  transition:
    opacity 1.5s ease,
    filter 1.5s ease;
}

.is-hero .globe-surface {
  opacity: 1;
}

.is-explore .globe-surface {
  opacity: 1;
  filter: none;
}

/* Route pills stay hidden until the user starts exploring. MapLibre sets marker opacity
   inline (to dim ones behind the globe), so this needs !important */
.globe-page:not(.is-explore) :deep(.map-pill) {
  opacity: 0 !important;
  pointer-events: none;
}

/* MapLibre builds the popup frame around our RouteCard, so its parts need :deep() */
.globe-surface :deep(.route-card-popup .maplibregl-popup-content) {
  padding: 0;
  overflow: hidden;
  border-radius: 0.9rem;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}

.globe-surface :deep(.route-card-popup .maplibregl-popup-tip) {
  display: none;
}

.globe-surface :deep(.route-card-popup .maplibregl-popup-close-button) {
  top: 0.35rem;
  right: 0.5rem;
  font-size: 1.1rem;
}

/* Sits over the globe while it dives onto a route; the label shows straight away and
   the black fade starts once the route's satellite photos have loaded (.is-fading) */
.globe-route-dive {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 3rem;
}

/* The black layer fades its opacity rather than its colour, so the browser can blend it
   without repainting the whole screen on every frame of the dive */
.globe-route-dive::before {
  content: '';
  position: absolute;
  inset: 0;
  background: #000000;
  opacity: 0;
  transition: opacity 0.6s ease-in;
}

.globe-route-dive.is-fading::before {
  opacity: 1;
}

.globe-route-dive-label {
  position: relative;
  margin: 0;
  padding: 0.6rem 1.25rem;
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.85);
  color: #ffffff;
  letter-spacing: 0.04em;
  opacity: 0;
  animation: fade-in 0.4s ease forwards;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
