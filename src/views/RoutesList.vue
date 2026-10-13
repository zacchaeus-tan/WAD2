<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoutesStore } from '@/stores/routes'
import { useRouter } from 'vue-router'
import { difficultyLabel, difficultyClass } from '@/lib/format'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import RouteFilters from '@/components/routes/RouteFilters.vue'

const routesStore = useRoutesStore()
const router = useRouter()

// filter state — plain refs, not tied to any HTML default attributes
const countryFilter = ref('all')
const difficultyFilter = ref('all')
const multidayOnly = ref(false)

onMounted(() => {
  routesStore.fetchRoutes()
})

// derive filter options from the actual data, so this doesn't drift out of sync
// with what's really in the routes table
const countries = computed(() => {
  const unique = new Set(routesStore.routes.map((route) => route.country).filter(Boolean))
  return ['all', ...unique]
})

const difficulties = computed(() => {
  const unique = new Set(
    routesStore.routes
      .filter((route) => route.effective_difficulty != null)
      .map((route) => difficultyLabel(route.effective_difficulty)),
  )
  return ['all', ...unique]
})

// the actual filtered list — cached, recomputes only when routes or filters change
const filteredRoutes = computed(() => {
  return routesStore.routes.filter((route) => {
    if (countryFilter.value !== 'all' && route.country !== countryFilter.value) return false
    if (
      difficultyFilter.value !== 'all' &&
      (route.effective_difficulty == null ||
        difficultyLabel(route.effective_difficulty) !== difficultyFilter.value)
    ) return false
    if (multidayOnly.value && !route.is_multiday) return false
    return true
  })
})

function goToRoute(id) {
  router.push({ name: 'route-detail', params: { id } })
}
</script>

<template>
  <main class="routes-page">
    <div class="container py-4 py-lg-5">
      <header class="routes-heading mb-4 mb-lg-5">
        <div>
          <p class="routes-eyebrow mb-2">Find your next adventure</p>
          <h1 class="mb-2">Trekking routes</h1>
          <p class="routes-intro mb-0">Explore trails, compare their challenges, and plan a journey worth remembering.</p>
        </div>
        <div class="route-total" aria-live="polite">
          <span>{{ filteredRoutes.length }}</span>
          <span>{{ filteredRoutes.length === 1 ? 'route' : 'routes' }} to explore</span>
        </div>
      </header>

      <div class="filters-panel mb-4 mb-lg-5">
        <RouteFilters
          v-model:country="countryFilter"
          v-model:difficulty="difficultyFilter"
          v-model:multidayOnly="multidayOnly"
          :countries="countries"
          :difficulties="difficulties"
        />
      </div>

      <!-- Loading / error states -->
      <LoadingSpinner v-if="routesStore.loading" />

      <div v-else-if="routesStore.error" class="alert alert-danger state-alert">
        Failed to load routes: {{ routesStore.error }}
      </div>

      <div v-else-if="filteredRoutes.length === 0" class="empty-state">
        <span class="empty-state-icon" aria-hidden="true">⌁</span>
        <h2 class="h5 mb-2">No routes found</h2>
        <p class="mb-0">Try adjusting your filters to discover more trails.</p>
      </div>

      <!-- Route cards -->
      <div v-else class="row g-4">
        <div v-for="route in filteredRoutes" :key="route.id" class="col-12 col-md-6 col-lg-4">
          <article
            class="card h-100 route-card"
            role="button"
            tabindex="0"
            @click="goToRoute(route.id)"
            @keydown.enter="goToRoute(route.id)"
            @keydown.space.prevent="goToRoute(route.id)"
          >
            <div class="card-body">
              <div class="route-card-heading">
                <span class="route-marker" aria-hidden="true">↗</span>
                <span v-if="route.is_multiday" class="route-type">Multi-day</span>
              </div>
              <h2 class="card-title h5">{{ route.name }}</h2>
              <h3 class="card-subtitle">{{ route.country }}</h3>

              <ul class="route-facts list-unstyled small mb-3">
                <li v-if="route.distance_km != null"><span aria-hidden="true">↔</span>{{ route.distance_km }} km</li>
                <li v-if="route.elevation_gain_m != null"><span aria-hidden="true">↑</span>{{ route.elevation_gain_m }} m ascent</li>
                <li v-if="route.duration_days != null">
                  <span aria-hidden="true">◷</span>{{ route.duration_days }} day{{ route.duration_days > 1 ? 's' : '' }}
                </li>
              </ul>

              <div class="d-flex flex-wrap align-items-center gap-2">
                <span
                  v-if="route.effective_difficulty != null"
                  class="badge"
                  :class="difficultyClass(route.effective_difficulty)"
                >
                  {{ difficultyLabel(route.effective_difficulty) }}
                </span>

                <span
                  v-if="route.effective_difficulty != null && Number(route.effective_difficulty) !== Number(route.official_difficulty)"
                  class="badge bg-light text-dark border"
                >
                  Community adjusted
                </span>

                <span
                  v-if="route.safety_status && route.safety_status !== 'open'"
                  class="badge bg-secondary"
                >
                  {{ route.safety_status }}
                </span>
              </div>

              <div v-if="route.review_count" class="route-rating small mt-3">
                <span aria-hidden="true">★</span> {{ route.avg_rating }} <span class="rating-divider">·</span> {{ route.review_count }} review{{ route.review_count === 1 ? '' : 's' }}
              </div>
            </div>
            <div class="route-card-footer">Explore route <span aria-hidden="true">→</span></div>
          </article>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.routes-page {
  min-height: calc(100vh - 4rem);
  background:
    radial-gradient(ellipse at 85% 0%, rgb(218 231 215 / 48%), transparent 34rem),
    #f7f8f5;
}

.routes-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1.5rem;
}

.routes-eyebrow {
  color: #64815d;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.routes-heading h1 {
  color: #1e3026;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 750;
  letter-spacing: -0.045em;
}

.routes-intro {
  max-width: 38rem;
  color: #69746b;
}

.route-total {
  display: grid;
  min-width: 8.5rem;
  padding: 0.85rem 1.1rem;
  border: 1px solid #e3e9df;
  border-radius: 1rem;
  background: rgb(255 255 255 / 75%);
  color: #69746b;
  font-size: 0.8rem;
  text-align: center;
}

.route-total span:first-child {
  color: #294936;
  font-size: 1.55rem;
  font-weight: 750;
  line-height: 1.2;
}

.filters-panel {
  padding: 1rem 1.25rem;
  border: 1px solid #e6eae3;
  border-radius: 1rem;
  background: rgb(255 255 255 / 88%);
  box-shadow: 0 8px 28px rgb(34 54 39 / 4%);
}

.route-card {
  cursor: pointer;
  overflow: hidden;
  border: 1px solid #e8ece5;
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 8px 24px rgb(33 52 39 / 5%);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.route-card:hover,
.route-card:focus-visible {
  transform: translateY(-4px);
  border-color: #c7d6c1;
  box-shadow: 0 16px 34px rgb(33 52 39 / 11%);
  outline: none;
}

.route-card .card-body {
  padding: 1.35rem 1.4rem 1.15rem;
}

.route-card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.route-marker {
  display: grid;
  width: 2.35rem;
  height: 2.35rem;
  place-items: center;
  border-radius: 0.8rem;
  background: #edf3e9;
  color: #52704f;
  font-size: 1.2rem;
  font-weight: 700;
}

.route-type {
  color: #72806f;
  font-size: 0.72rem;
  font-weight: 650;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.route-card .card-title {
  margin-bottom: 0.35rem;
  color: #25372c;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.route-card .card-subtitle {
  margin-bottom: 1.15rem;
  color: #738075;
  font-size: 0.88rem;
  font-weight: 500;
}

.route-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem 1rem;
  color: #5f6e61;
}

.route-facts li {
  display: flex;
  align-items: center;
  gap: 0.38rem;
}

.route-facts li span {
  color: #64815d;
  font-weight: 700;
}

.route-rating {
  color: #59685c;
}

.route-rating > span:first-child {
  color: #c28e37;
}

.rating-divider {
  margin: 0 0.25rem;
  color: #a2aaa1;
}

.route-card-footer {
  display: flex;
  justify-content: space-between;
  padding: 0.8rem 1.4rem;
  border-top: 1px solid #edf0eb;
  color: #52704f;
  font-size: 0.82rem;
  font-weight: 650;
}

.route-card-footer span {
  transition: transform 0.2s ease;
}

.route-card:hover .route-card-footer span {
  transform: translateX(3px);
}

.empty-state {
  padding: 3.5rem 1.5rem;
  border: 1px dashed #d7dfd3;
  border-radius: 1rem;
  background: rgb(255 255 255 / 65%);
  color: #69746b;
  text-align: center;
}

.empty-state-icon {
  display: inline-block;
  margin-bottom: 0.7rem;
  color: #6f8a68;
  font-size: 2rem;
}

.empty-state h2 {
  color: #2d4032;
}

.state-alert {
  border-radius: 0.9rem;
}

@media (max-width: 575.98px) {
  .routes-heading {
    align-items: start;
  }

  .route-total {
    min-width: 6.5rem;
    padding: 0.65rem 0.75rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .route-card,
  .route-card-footer span {
    transition: none;
  }
}
</style>
