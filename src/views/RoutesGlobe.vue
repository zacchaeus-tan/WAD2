<script setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useRoutesStore } from '@/stores/routes'

const router = useRouter()
const routesStore = useRoutesStore()

const mapContainer = ref(null)
const map = shallowRef(null)
const mapReady = ref(false)
const selectedCountry = ref('all')

const mappableRoutes = computed(() => routesStore.routes.filter((route) => route.geometry))

const countries = computed(() => {
  const unique = new Set(mappableRoutes.value.map((route) => route.country).filter(Boolean))
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

function applyCountryFilter() {
  if (!map.value?.getLayer('route-lines')) return
  map.value.setFilter(
    'route-lines',
    selectedCountry.value === 'all' ? null : ['==', ['get', 'country'], selectedCountry.value],
  )
}

function showRoutePopup(event) {
  const properties = event.features?.[0]?.properties
  if (!properties) return

  const element = document.createElement('div')
  const title = document.createElement('strong')
  title.textContent = properties.name || 'Unnamed route'
  const country = document.createElement('div')
  country.textContent = properties.country || ''
  const link = document.createElement('a')
  link.textContent = 'View route details →'
  link.href = router.resolve({ name: 'route-detail', params: { id: properties.id } }).href
  link.addEventListener('click', (clickEvent) => {
    clickEvent.preventDefault()
    router.push({ name: 'route-detail', params: { id: properties.id } })
  })
  element.append(title, country, link)

  new maplibregl.Popup({ closeButton: true })
    .setLngLat(event.lngLat)
    .setDOMContent(element)
    .addTo(map.value)
}

watch([mapReady, geojson], () => {
  if (!mapReady.value) return
  map.value.getSource('route-data')?.setData(geojson.value)
  applyCountryFilter()
})

onMounted(() => {
  routesStore.fetchRoutes()

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
    map.value.addSource('route-data', { type: 'geojson', data: geojson.value })
    map.value.addLayer({
      id: 'route-lines',
      type: 'line',
      source: 'route-data',
      paint: {
        'line-color': [
          'match', ['get', 'country'],
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

    map.value.on('click', 'route-lines', showRoutePopup)
    map.value.on('mouseenter', 'route-lines', () => {
      map.value.getCanvas().style.cursor = 'pointer'
    })
    map.value.on('mouseleave', 'route-lines', () => {
      map.value.getCanvas().style.cursor = ''
    })

    mapReady.value = true
    applyCountryFilter()
  })
})

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

      <div v-if="routesStore.error" class="alert alert-danger">
        Unable to load route data: {{ routesStore.error }}
      </div>
      <div v-else class="globe-card position-relative">
        <div ref="mapContainer" class="globe-map"></div>
        <div v-if="routesStore.loading || !mapReady" class="map-status">Loading routes…</div>
        <div v-else class="map-count">{{ routeCount }} routes · Scroll to zoom · Drag to rotate</div>
      </div>

      <p class="small text-muted mt-2 mb-0">Click a route to open its details page.</p>
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
