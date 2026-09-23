<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoutesStore } from '@/stores/routes'
import { useRouter } from 'vue-router'
import { difficultyLabel, difficultyClass } from '@/lib/format'

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
  const unique = new Set(routesStore.routes.map((r) => r.country))
  return ['all', ...unique]
})

const difficulties = computed(() => {
  const unique = new Set(routesStore.routes.map((r) => difficultyLabel(r.effective_difficulty)))
  return ['all', ...unique]
})

// the actual filtered list — cached, recomputes only when routes or filters change
const filteredRoutes = computed(() => {
  return routesStore.routes.filter((route) => {
    if (countryFilter.value !== 'all' && route.country !== countryFilter.value) return false
    if (difficultyFilter.value !== 'all' && difficultyLabel(route.effective_difficulty) !== difficultyFilter.value) return false
    if (multidayOnly.value && !route.is_multiday) return false
    return true
  })
})

function goToRoute(id) {
  router.push({ name: 'route-detail', params: { id } })
}
</script>

<template>
  <div class="container py-4">
    <h1 class="mb-4">Trekking Routes</h1>

    <!-- Filters -->
    <div class="row g-3 mb-4 align-items-end">
      <div class="col-12 col-md-4">
        <label for="country-select" class="form-label">Country</label>
        <select id="country-select" v-model="countryFilter" class="form-select">
          <option v-for="c in countries" :key="c" :value="c">
            {{ c === 'all' ? 'All countries' : c }}
          </option>
        </select>
      </div>

      <div class="col-12 col-md-4">
        <label for="difficulty-select" class="form-label">Difficulty</label>
        <select id="difficulty-select" v-model="difficultyFilter" class="form-select">
          <option v-for="d in difficulties" :key="d" :value="d">
            {{ d === 'all' ? 'All difficulties' : d }}
          </option>
        </select>
      </div>

      <div class="col-12 col-md-4">
        <div class="form-check">
          <input
            id="multiday-check"
            v-model="multidayOnly"
            class="form-check-input"
            type="checkbox"
          />
          <label class="form-check-label" for="multiday-check">
            Multi-day treks only
          </label>
        </div>
      </div>
    </div>

    <!-- Loading / error states -->
    <div v-if="routesStore.loading" class="text-center py-5">
      <div class="spinner-border" role="status"></div>
    </div>

    <div v-else-if="routesStore.error" class="alert alert-danger">
      Failed to load routes: {{ routesStore.error }}
    </div>

    <div v-else-if="filteredRoutes.length === 0" class="alert alert-secondary">
      No routes match your filters.
    </div>

    <!-- Route cards -->
    <div v-else class="row g-4">
      <div v-for="route in filteredRoutes" :key="route.id" class="col-12 col-md-6 col-lg-4">
        <div
          class="card h-100 shadow-sm route-card"
          role="button"
          @click="goToRoute(route.id)"
        >
          <div class="card-body">
            <h5 class="card-title">{{ route.name }}</h5>
            <h6 class="card-subtitle mb-2 text-muted">{{ route.country }}</h6>

            <ul class="list-unstyled small mb-3">
              <li>📏 {{ route.distance_km }} km</li>
              <li>⛰️ {{ route.elevation_gain_m }} m gain</li>
              <li>🗓️ {{ route.duration_days }} day{{ route.duration_days > 1 ? 's' : '' }}</li>
            </ul>

            <span class="badge" :class="difficultyClass(route.effective_difficulty)">
              {{ difficultyLabel(route.effective_difficulty) }}
            </span>

            <span
              v-if="Number(route.effective_difficulty) !== Number(route.official_difficulty)"
              class="badge bg-light text-dark border ms-2"
            >
              community adjusted
            </span>

            <span
              v-if="route.safety_status !== 'open'"
              class="badge bg-secondary ms-2"
            >
              {{ route.safety_status }}
            </span>

            <div v-if="route.review_count" class="small text-muted mt-2">
              {{ route.avg_rating }}★ · {{ route.review_count }} review(s)
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.route-card {
  cursor: pointer;
  transition: transform 0.15s ease;
}
.route-card:hover {
  transform: translateY(-2px);
}
</style>