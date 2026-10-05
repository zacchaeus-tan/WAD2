<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const mapContainer = ref(null)
const map = ref(null)
const loading = ref(true)
const error = ref(null)
const selectedCountry = ref('all')
const routeCount = ref(0)

const routeFiles = [
  ['Indonesia', 'indonesia-routes.geojson'],
  ['Malaysia', 'malaysia-routes.geojson'],
  ['Philippines', 'phillipines-routes.geojson'],
  ['Singapore', 'singapore-routes.geojson'],
  ['Thailand', 'thailand-routes.geojson'],
  ['Vietnam', 'vietnam-routes.geojson'],
]

const countries = computed(() => ['all', ...routeFiles.map(([country]) => country)])

async function loadRoutes() {
  const collections = await Promise.all(
    routeFiles.map(async ([country, filename]) => {
      const response = await fetch(`/geojson/${filename}`)
      if (!response.ok) throw new Error(`Could not load ${filename}`)

      const collection = await response.json()
      return {
        ...collection,
        features: collection.features
          .filter((feature) => ['LineString', 'MultiLineString'].includes(feature.geometry?.type))
          .map((feature) => ({
            ...feature,
            properties: { ...feature.properties, country },
          })),
      }
    }),
  )

  return {
    type: 'FeatureCollection',
    features: collections.flatMap((collection) => collection.features),
  }
}

function applyCountryFilter() {
  if (!map.value?.getLayer('route-lines')) return

  map.value.setFilter(
    'route-lines',
    selectedCountry.value === 'all'
      ? null
      : ['==', ['get', 'country'], selectedCountry.value],
  )
}

function addRoutePopup(event) {
  const feature = event.features?.[0]
  if (!feature) return

  const name = feature.properties?.name || 'Unnamed hiking route'
  const country = feature.properties?.country || 'Unknown country'
  const osmId = feature.properties?.['@id'] || 'Not available'

  new maplibregl.Popup({ closeButton: true })
    .setLngLat(event.lngLat)
    .setHTML(
      `<strong>${name}</strong><br><span>${country}</span><br><small>OpenStreetMap: ${osmId}</small>`,
    )
    .addTo(map.value)
}

async function initialiseMap() {
  try {
    const geojson = await loadRoutes()
    routeCount.value = geojson.features.length

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
      map.value.addSource('route-data', { type: 'geojson', data: geojson })
      map.value.addLayer({
        id: 'route-lines',
        type: 'line',
        source: 'route-data',
        paint: {
          'line-color': [
            'match',
            ['get', 'country'],
            'Indonesia', '#ef476f',
            'Malaysia', '#118ab2',
            'Philippines', '#f78c6b',
            'Singapore', '#06d6a0',
            'Thailand', '#ffd166',
            'Vietnam', '#9b5de5',
            '#ffffff',
          ],
          'line-width': ['interpolate', ['linear'], ['zoom'], 1, 0.7, 8, 2.5, 14, 5],
          'line-opacity': 0.82,
        },
      })

      map.value.on('click', 'route-lines', addRoutePopup)
      map.value.on('mouseenter', 'route-lines', () => {
        map.value.getCanvas().style.cursor = 'pointer'
      })
      map.value.on('mouseleave', 'route-lines', () => {
        map.value.getCanvas().style.cursor = ''
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
        <div class="d-flex align-items-center gap-2">
          <label for="country-filter" class="small text-muted">Country</label>
          <select id="country-filter" v-model="selectedCountry" class="form-select" @change="applyCountryFilter">
            <option v-for="country in countries" :key="country" :value="country">
              {{ country === 'all' ? 'All countries' : country }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="error" class="alert alert-danger">Unable to load route data: {{ error }}</div>
      <div v-else class="globe-card position-relative">
        <div ref="mapContainer" class="globe-map"></div>
        <div v-if="loading" class="map-status">Loading {{ routeCount || 'route' }} routes…</div>
        <div v-else class="map-count">{{ routeCount }} routes · Scroll to zoom · Drag to rotate</div>
      </div>

      <p class="small text-muted mt-2 mb-0">
        Route data © OpenStreetMap contributors. Click a route to view its source details.
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

@media (max-width: 576px) {
  .globe-card,
  .globe-map {
    min-height: 500px;
    height: 500px;
  }
}
</style>
