<script setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useRoutesStore } from '@/stores/routes'
import { fetchAllTrails } from '@/services/routes.service'
import { difficultyLabel } from '@/lib/format'

const routesStore = useRoutesStore()
const router = useRouter()

const mapContainer = ref(null)
const map = shallowRef(null)
const mapReady = ref(false)
const selectedCountry = ref('all')
const showAllTrails = ref(false)
const trailsLoading = ref(false)
const error = ref(null)

const mappableRoutes = computed(() => routesStore.routes.filter((route) => route.geometry))

const countries = computed(() => {
  const unique = new Set(
    routesStore.routes
      .map((route) => route.country)
      .filter(Boolean),
  )
  return ['all', ...[...unique].sort()]
})

const geojson = computed(() => ({
  type: 'FeatureCollection',
  features: mappableRoutes.value.map((route) => ({
    type: 'Feature',
    geometry: route.geometry,
    properties: { id: route.id, name: route.name, country: route.country },
  })),
}))

const routeCount = computed(() => geojson.value.features.length)

const DIFFICULTY_COLOURS = { 1: '#198754', 2: '#0dcaf0', 3: '#ffc107', 4: '#dc3545' }
const difficultyPaint = [
  'match',
  ['get', 'difficulty'],
  1, DIFFICULTY_COLOURS[1],
  2, DIFFICULTY_COLOURS[2],
  3, DIFFICULTY_COLOURS[3],
  4, DIFFICULTY_COLOURS[4],
  '#adb5bd',
]
const ROUTE_LAYERS = ['route-lines', 'route-points']

function routeProperties(route) {
  const difficulty = Number(route.effective_difficulty)
  return {
    id: route.id,
    name: route.name,
    country: route.country,
    difficulty: difficulty ? Math.min(Math.max(Math.round(difficulty), 1), 4) : 0,
    difficultyLabel: difficultyLabel(route.effective_difficulty),
    safetyStatus: route.safety_status,
    hazardLevel: route.community_hazard_level,
  }
}

function buildRouteData() {
  const lines = []
  const points = []

  routesStore.routes.forEach((route) => {
    const properties = routeProperties(route)
    if (route.geometry) {
      lines.push({ type: 'Feature', properties, geometry: route.geometry })
    }
    if (route.latitude !== null && route.longitude !== null) {
      points.push({
        type: 'Feature',
        properties,
        geometry: { type: 'Point', coordinates: [Number(route.longitude), Number(route.latitude)] },
      })
    }
  })

  return {
    lines: { type: 'FeatureCollection', features: lines },
    points: { type: 'FeatureCollection', features: points },
  }
}

function applyCountryFilter() {
  const filter =
    selectedCountry.value === 'all' ? null : ['==', ['get', 'country'], selectedCountry.value]

  ROUTE_LAYERS.forEach((layer) => {
    if (map.value?.getLayer(layer)) map.value.setFilter(layer, filter)
  })
}

function showRoutePopup(event) {
  const properties = event.features?.[0]?.properties
  if (!properties) return

  const content = document.createElement('div')

  const title = document.createElement('strong')
  title.textContent = properties.name || 'Unnamed route'
  content.append(title, document.createElement('br'))

  const details = document.createElement('span')
  details.textContent = `${properties.country || ''} · ${properties.difficultyLabel || ''}`.trim()
  content.append(details, document.createElement('br'))

  const status = document.createElement('small')
  status.textContent = `Park status: ${properties.safetyStatus || 'unknown'} · hazard ${properties.hazardLevel || 'unknown'}`
  content.append(status, document.createElement('br'))

  const link = document.createElement('button')
  link.type = 'button'
  link.className = 'btn btn-sm btn-success mt-2'
  link.textContent = 'View route'
  link.addEventListener('click', () => {
    router.push({ name: 'route-detail', params: { id: properties.id } })
  })
  content.append(link)

  new maplibregl.Popup({ closeButton: true })
    .setLngLat(event.lngLat)
    .setDOMContent(content)
    .addTo(map.value)
}

async function toggleAllTrails() {
  if (!map.value) return

  if (!map.value.getLayer('all-trails')) {
    if (!showAllTrails.value) return
    trailsLoading.value = true
    try {
      const geojson = await fetchAllTrails()
      map.value.addSource('all-trails', { type: 'geojson', data: geojson })
      map.value.addLayer(
        {
          id: 'all-trails',
          type: 'line',
          source: 'all-trails',
          paint: { 'line-color': '#ced4da', 'line-width': 1, 'line-opacity': 0.45 },
        },
        'route-lines',
      )
    } catch (loadError) {
      error.value = loadError.message
    }
    trailsLoading.value = false
  }

  if (map.value.getLayer('all-trails')) {
    map.value.setLayoutProperty('all-trails', 'visibility', showAllTrails.value ? 'visible' : 'none')
  }
}

function applyRouteData() {
  if (!mapReady.value) return

  const { lines, points } = buildRouteData()
  if (map.value?.getSource('route-lines')) map.value.getSource('route-lines').setData(lines)
  if (map.value?.getSource('route-points')) map.value.getSource('route-points').setData(points)

  applyCountryFilter()
}

watch([mapReady, geojson], () => {
  applyRouteData()
})

onMounted(() => {
  routesStore.fetchRouteGeometries()

  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: [112, 8],
    zoom: 2.2,
    minZoom: 1.3,
    maxZoom: 16,
    dragRotate: true,
    touchZoomRotate: true,
  })

  map.value.addControl(new maplibregl.NavigationControl(), 'top-right')
  map.value.addControl(new maplibregl.GlobeControl(), 'top-right')

  map.value.on('load', () => {
    map.value.setProjection({ type: 'globe' })
    const { lines, points } = buildRouteData()

    map.value.addSource('route-lines', { type: 'geojson', data: lines })
    map.value.addLayer({
      id: 'route-lines',
      type: 'line',
      source: 'route-lines',
      paint: {
        'line-color': difficultyPaint,
        'line-width': ['interpolate', ['linear'], ['zoom'], 1, 1.5, 8, 3, 14, 5],
        'line-opacity': 0.9,
      },
    })

    map.value.addSource('route-points', { type: 'geojson', data: points })
    map.value.addLayer({
      id: 'route-points',
      type: 'circle',
      source: 'route-points',
      paint: {
        'circle-color': difficultyPaint,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, 4, 8, 7, 14, 9],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1.5,
      },
    })

    ROUTE_LAYERS.forEach((layer) => {
      map.value.on('click', layer, showRoutePopup)
      map.value.on('mouseenter', layer, () => {
        map.value.getCanvas().style.cursor = 'pointer'
      })
      map.value.on('mouseleave', layer, () => {
        map.value.getCanvas().style.cursor = ''
      })
    })

    mapReady.value = true
    applyCountryFilter()
  })
})

onBeforeUnmount(() => map.value?.remove())
</script>

<template>
  <main class="globe-page">
    <div class="container py-4 py-lg-5">
      <div class="globe-heading d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <p class="globe-eyebrow mb-2">Your next trail is out there</p>
          <h1 class="mb-2">Explore the globe</h1>
          <p class="globe-intro mb-0">Discover hiking routes across Southeast Asia, one landscape at a time.</p>
        </div>
        <div class="globe-controls d-flex flex-wrap align-items-center gap-3">
          <div class="form-check form-switch mb-0">
            <input
              id="all-trails"
              v-model="showAllTrails"
              class="form-check-input"
              type="checkbox"
              :disabled="routesStore.loading || trailsLoading"
              @change="toggleAllTrails"
            />
            <label class="form-check-label small text-muted" for="all-trails">
              {{ trailsLoading ? 'Loading trails…' : 'Show all mapped trails' }}
            </label>
          </div>
          <div class="d-flex align-items-center gap-2">
            <label for="country-filter" class="small">Country</label>
            <select id="country-filter" v-model="selectedCountry" class="form-select" @change="applyCountryFilter">
              <option v-for="country in countries" :key="country" :value="country">
                {{ country === 'all' ? 'All countries' : country }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="routesStore.error || error" class="alert alert-danger">
        Unable to load route data: {{ routesStore.error || error }}
      </div>
      <div v-else class="globe-card position-relative">
        <div ref="mapContainer" class="globe-map"></div>
        <div v-if="routesStore.loading || !mapReady" class="map-status">Loading routes…</div>
        <div v-else class="map-count">
          <strong>{{ routeCount }}</strong> routes <span aria-hidden="true">·</span> Scroll to zoom <span aria-hidden="true">·</span> Drag to rotate
        </div>
      </div>

      <div class="globe-legend d-flex flex-wrap align-items-center gap-3 small mt-3">
        <span v-for="(colour, level) in DIFFICULTY_COLOURS" :key="level">
          <span class="legend-dot" :style="{ background: colour }"></span>
          {{ difficultyLabel(level) }}
        </span>
      </div>

      <p class="map-attribution small mt-3 mb-0">
        Trail lines © OpenStreetMap contributors. Click a route to open its details.
      </p>
    </div>
  </main>
</template>

<style scoped>
.globe-page {
  min-height: calc(100vh - 4rem);
  background:
    radial-gradient(ellipse at 88% 0%, rgb(218 231 215 / 42%), transparent 34rem),
    #f7f8f5;
}

.globe-heading h1 {
  color: #1e3026;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 750;
  letter-spacing: -0.045em;
}

.globe-eyebrow {
  color: #64815d;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.globe-intro {
  color: #69746b;
}

.globe-controls {
  padding: 0.75rem 1rem;
  border: 1px solid #e3e9df;
  border-radius: 0.9rem;
  background: rgb(255 255 255 / 85%);
  box-shadow: 0 8px 24px rgb(34 54 39 / 4%);
}

.globe-controls label {
  color: #58675a;
}

.globe-controls .form-select {
  min-width: 10rem;
  border-color: #dce4d8;
  border-radius: 0.65rem;
}

.globe-controls .form-check-input:checked {
  border-color: #52704f;
  background-color: #52704f;
}

.globe-card {
  overflow: hidden;
  min-height: 620px;
  border: 1px solid #dce4d8;
  border-radius: 1.1rem;
  background: #dce8e2;
  box-shadow: 0 16px 40px rgb(33 52 39 / 12%);
}

.globe-map {
  width: 100%;
  height: 620px;
  background: #dce8e2;
}

.map-status,
.map-count {
  position: absolute;
  left: 1rem;
  bottom: 1rem;
  padding: 0.55rem 0.85rem;
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 0.65rem;
  color: #fff;
  background: rgb(26 43 33 / 84%);
  box-shadow: 0 4px 14px rgb(0 0 0 / 16%);
  font-size: 0.85rem;
  backdrop-filter: blur(8px);
}

.map-count strong {
  color: #d8ead0;
}

.map-count span {
  margin: 0 0.2rem;
  color: #afc0b2;
}

.globe-legend {
  padding: 0.9rem 1rem;
  border: 1px solid #e5eae2;
  border-radius: 0.85rem;
  background: rgb(255 255 255 / 80%);
  color: #5e6b60;
}

.globe-legend > span {
  display: inline-flex;
  align-items: center;
}

.legend-dot {
  display: inline-block;
  width: 0.7rem;
  height: 0.7rem;
  margin-right: 0.4rem;
  border-radius: 50%;
  box-shadow: 0 0 0 2px #fff, 0 0 0 3px rgb(38 57 45 / 12%);
}

.map-attribution {
  color: #7a857b;
}

@media (max-width: 576px) {
  .globe-controls {
    width: 100%;
    align-items: flex-start !important;
  }

  .globe-controls > div:last-child {
    width: 100%;
    justify-content: space-between;
  }

  .globe-card,
  .globe-map {
    min-height: 500px;
    height: 500px;
  }
}
</style>
