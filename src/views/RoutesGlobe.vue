<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { supabase } from '@/lib/supabase'
import { useRoutesStore } from '@/stores/routes'
import { difficultyLabel } from '@/lib/format'

const routesStore = useRoutesStore()
const router = useRouter()

const mapContainer = ref(null)
const map = ref(null)
const loading = ref(true)
const error = ref(null)
const selectedCountry = ref('all')
const showAllTrails = ref(false)
const trailsLoading = ref(false)

// Raw OpenStreetMap exports, kept in the public route-geojson storage bucket.
// Only fetched when the "all trails" background layer is switched on.
const TRAIL_BUCKET = 'route-geojson'
const TRAIL_FILES = [
  'indonesia-routes.geojson',
  'malaysia-routes.geojson',
  'phillipines-routes.geojson',
  'singapore-routes.geojson',
  'thailand-routes.geojson',
  'vietnam-routes.geojson',
]

// Same colours as the difficulty badges on the list and detail pages.
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

const countries = computed(() => {
  const unique = new Set(routesStore.routes.map((r) => r.country))
  return ['all', ...unique]
})

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

// Every route gets a marker so it is visible at globe zoom; routes linked to
// an OpenStreetMap trail also get their line.
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

function addRoutePopup(event) {
  const properties = event.features?.[0]?.properties
  if (!properties) return

  const content = document.createElement('div')

  const title = document.createElement('strong')
  title.textContent = properties.name
  content.append(title, document.createElement('br'))

  const details = document.createElement('span')
  details.textContent = `${properties.country} · ${properties.difficultyLabel}`
  content.append(details, document.createElement('br'))

  const status = document.createElement('small')
  status.textContent = `Park status: ${properties.safetyStatus} · hazard ${properties.hazardLevel}`
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

async function loadAllTrails() {
  const collections = await Promise.all(
    TRAIL_FILES.map(async (filename) => {
      const { data } = supabase.storage.from(TRAIL_BUCKET).getPublicUrl(filename)
      const response = await fetch(data.publicUrl)
      if (!response.ok) throw new Error(`Could not load ${filename}`)
      return response.json()
    }),
  )

  return {
    type: 'FeatureCollection',
    features: collections
      .flatMap((collection) => collection.features)
      .filter((feature) => ['LineString', 'MultiLineString'].includes(feature.geometry?.type)),
  }
}

async function toggleAllTrails() {
  if (!map.value) return

  if (!map.value.getLayer('all-trails')) {
    if (!showAllTrails.value) return
    trailsLoading.value = true
    try {
      const geojson = await loadAllTrails()
      map.value.addSource('all-trails', { type: 'geojson', data: geojson })
      // Inserted below the curated routes so those stay on top and clickable.
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

async function initialiseMap() {
  await routesStore.fetchRoutes()
  if (routesStore.error) {
    error.value = routesStore.error
    loading.value = false
    return
  }

  try {
    const { lines, points } = buildRouteData()

    map.value = new maplibregl.Map({
      container: mapContainer.value,
      style: 'https://demotiles.maplibre.org/style.json',
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
        map.value.on('click', layer, addRoutePopup)
        map.value.on('mouseenter', layer, () => {
          map.value.getCanvas().style.cursor = 'pointer'
        })
        map.value.on('mouseleave', layer, () => {
          map.value.getCanvas().style.cursor = ''
        })
      })

      loading.value = false
    })
  } catch (loadError) {
    error.value = loadError.message
    loading.value = false
  }
}

onMounted(initialiseMap)
onBeforeUnmount(() => map.value?.remove())
</script>

<template>
  <main class="globe-page">
    <div class="container py-4">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div>
          <h1 class="mb-1">Routes Globe</h1>
          <p class="text-muted mb-0">Explore hiking routes across Southeast Asia.</p>
        </div>
        <div class="d-flex flex-wrap align-items-center gap-3">
          <div class="form-check form-switch mb-0">
            <input
              id="all-trails"
              v-model="showAllTrails"
              class="form-check-input"
              type="checkbox"
              :disabled="loading || trailsLoading"
              @change="toggleAllTrails"
            />
            <label class="form-check-label small text-muted" for="all-trails">
              {{ trailsLoading ? 'Loading trails…' : 'Show all mapped trails' }}
            </label>
          </div>
          <div class="d-flex align-items-center gap-2">
            <label for="country-filter" class="small text-muted">Country</label>
            <select id="country-filter" v-model="selectedCountry" class="form-select" @change="applyCountryFilter">
              <option v-for="country in countries" :key="country" :value="country">
                {{ country === 'all' ? 'All countries' : country }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="error" class="alert alert-danger">Unable to load route data: {{ error }}</div>
      <div v-else class="globe-card position-relative">
        <div ref="mapContainer" class="globe-map"></div>
        <div v-if="loading" class="map-status">Loading routes…</div>
        <div v-else class="map-count">
          {{ routesStore.routes.length }} routes · Scroll to zoom · Drag to rotate
        </div>
      </div>

      <div class="d-flex flex-wrap align-items-center gap-3 small text-muted mt-2">
        <span v-for="(colour, level) in DIFFICULTY_COLOURS" :key="level">
          <span class="legend-dot" :style="{ background: colour }"></span>
          {{ difficultyLabel(level) }}
        </span>
      </div>

      <p class="small text-muted mt-2 mb-0">
        Trail lines © OpenStreetMap contributors. Click a route to open its details.
      </p>
    </div>
  </main>
</template>

<style scoped>
.globe-card {
  overflow: hidden;
  min-height: 620px;
  border: 1px solid #dee2e6;
  border-radius: 0.75rem;
  background: #101820;
  box-shadow: 0 0.25rem 1rem rgb(0 0 0 / 8%);
}

.globe-map {
  width: 100%;
  height: 620px;
}

.map-status,
.map-count {
  position: absolute;
  left: 1rem;
  bottom: 1rem;
  padding: 0.45rem 0.7rem;
  border-radius: 0.35rem;
  color: #fff;
  background: rgb(0 0 0 / 72%);
  font-size: 0.85rem;
}

.legend-dot {
  display: inline-block;
  width: 0.7rem;
  height: 0.7rem;
  margin-right: 0.25rem;
  border-radius: 50%;
}

@media (max-width: 576px) {
  .globe-card,
  .globe-map {
    min-height: 500px;
    height: 500px;
  }
}
</style>
