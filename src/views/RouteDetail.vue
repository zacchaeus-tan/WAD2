<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { RouterLink } from 'vue-router'
import { useRoutesStore } from '@/stores/routes'
import { useReviewsStore } from '@/stores/reviews'
import { useAuthStore } from '@/stores/auth'
import { useMatchStore } from '@/stores/match'
import { useChecklistStore } from '@/stores/checklist'
import { fetchWeather } from '@/lib/weather'
import { difficultyLabel, difficultyClass, verdictLabel, verdictClass, hazardClass, formatDate } from '@/lib/format'

const routeParam = useRoute()
const routesStore = useRoutesStore()
const reviewsStore = useReviewsStore()
const auth = useAuthStore()
const matchStore = useMatchStore()
const checklistStore = useChecklistStore()

const weather = ref(null)
const weatherError = ref('')
const customItem = ref('')
const saving = ref(false)
const formError = ref('')

const form = ref({
  rating: 5,
  perceivedDifficulty: 3,
  completed: true,
  reviewText: '',
  incidents: [],
})

const route = computed(() => routesStore.currentRoute)
const myReview = computed(() => (auth.user ? reviewsStore.myReview(auth.user.id) : null))
const divergence = computed(() => {
  if (!route.value?.effective_difficulty) return 0
  return Number(route.value.effective_difficulty) - Number(route.value.official_difficulty)
})

async function load() {
  const id = routeParam.params.id
  await routesStore.fetchRouteById(id)
  await Promise.all([reviewsStore.fetchForRoute(id), reviewsStore.fetchCategories()])

  if (route.value?.latitude && route.value?.longitude) {
    try {
      weather.value = await fetchWeather(route.value.latitude, route.value.longitude)
    } catch (e) {
      weatherError.value = e.message
    }
  }

  if (auth.profile) {
    await matchStore.computeForRoute(route.value, auth.profile)
    await checklistStore.load(id, auth.user.id)
  }
  resetForm()
}

function resetForm() {
  if (myReview.value) {
    form.value = {
      rating: myReview.value.rating,
      perceivedDifficulty: myReview.value.perceived_difficulty,
      completed: myReview.value.completed,
      reviewText: myReview.value.review_text || '',
      incidents: (myReview.value.review_incidents || []).map((i) => ({
        category: i.category,
        note: i.note,
        pointId: i.point_id,
      })),
    }
  } else {
    form.value = { rating: 5, perceivedDifficulty: 3, completed: true, reviewText: '', incidents: [] }
  }
}

onMounted(load)
watch(() => routeParam.params.id, load)
watch(() => auth.profile, async (profile) => {
  if (profile && route.value) {
    await matchStore.computeForRoute(route.value, profile)
    await checklistStore.load(route.value.id, auth.user.id)
  }
})

function addIncident() {
  if (form.value.incidents.length >= 3) return
  form.value.incidents.push({ category: 'navigation', note: '', pointId: null })
}

async function submitReview() {
  saving.value = true
  formError.value = ''

  const result = await reviewsStore.save({
    routeId: route.value.id,
    userId: auth.user.id,
    rating: form.value.rating,
    perceivedDifficulty: form.value.perceivedDifficulty,
    completed: form.value.completed,
    reviewText: form.value.reviewText,
    incidents: form.value.incidents.filter((i) => i.note.trim()),
  })

  if (!result.success) formError.value = result.error
  await routesStore.refreshCurrentRouteStats()
  if (auth.profile) await matchStore.computeForRoute(route.value, auth.profile)
  saving.value = false
}

async function deleteReview() {
  await reviewsStore.remove(myReview.value.id, route.value.id)
  await routesStore.refreshCurrentRouteStats()
  resetForm()
}

async function generateChecklist() {
  await checklistStore.generate(route.value, weather.value, auth.profile)
}
</script>

<template>
  <div class="container pb-5">
    <div v-if="routesStore.loading" class="text-center py-5"><div class="spinner-border"></div></div>
    <div v-else-if="routesStore.error" class="alert alert-danger">{{ routesStore.error }}</div>

    <div v-else-if="route">
      <!-- Header -->
      <h1>{{ route.name }}</h1>
      <p class="text-muted">{{ route.country }}</p>

      <div class="mb-3 d-flex flex-wrap gap-2">
        <span class="badge" :class="difficultyClass(route.effective_difficulty)">
          Effective: {{ difficultyLabel(route.effective_difficulty) }} ({{ route.effective_difficulty }})
        </span>
        <span class="badge bg-secondary">Official: {{ difficultyLabel(route.official_difficulty) }}</span>
        <span class="badge" :class="route.safety_status === 'open' ? 'bg-success' : 'bg-danger'">
          Park status: {{ route.safety_status }}
        </span>
        <span class="badge" :class="hazardClass(route.community_hazard_level)">
          Community hazard: {{ route.community_hazard_level }}
        </span>
      </div>

      <div v-if="route.safety_status !== 'open' && route.safety_status_note" class="alert alert-warning">
        {{ route.safety_status_note }}
      </div>
      <div v-if="route.community_hazard_note" class="alert alert-warning py-2 small">
        {{ route.community_hazard_note }}
      </div>

      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3"><div class="card text-center p-2">
          <small class="text-muted">Distance</small><strong>{{ route.distance_km }} km</strong>
        </div></div>
        <div class="col-6 col-md-3"><div class="card text-center p-2">
          <small class="text-muted">Elevation gain</small><strong>{{ route.elevation_gain_m }} m</strong>
        </div></div>
        <div class="col-6 col-md-3"><div class="card text-center p-2">
          <small class="text-muted">Duration</small><strong>{{ route.duration_days }} day(s)</strong>
        </div></div>
        <div class="col-6 col-md-3"><div class="card text-center p-2">
          <small class="text-muted">Max altitude</small><strong>{{ route.altitude_m }} m</strong>
        </div></div>
      </div>

      <!-- Feature 1: match -->
      <section class="mb-4">
        <h2 class="h5">Difficulty match</h2>
        <div v-if="!auth.isLoggedIn" class="alert alert-secondary">
          <RouterLink to="/auth">Sign in</RouterLink> and take the quiz to see whether this route matches you.
        </div>
        <div v-else-if="!auth.profile?.fitness_score" class="alert alert-secondary">
          <RouterLink to="/quiz">Take the quiz</RouterLink> to see your match.
        </div>
        <div v-else-if="matchStore.result" class="alert" :class="verdictClass(matchStore.result.verdict)">
          <h3 class="h6">{{ verdictLabel(matchStore.result.verdict) }}</h3>
          <p class="small mb-2">
            Your fitness score {{ matchStore.result.fitness_score }} vs route demand {{ matchStore.result.route_demand }}.
          </p>
          <p class="mb-2">{{ matchStore.result.explanation }}</p>
          <ul class="small mb-0">
            <li v-for="tip in matchStore.result.tips" :key="tip">{{ tip }}</li>
          </ul>
        </div>
      </section>

      <!-- Feature 3: weather -->
      <section class="mb-4">
        <h2 class="h5">Conditions at the trailhead</h2>
        <div v-if="weatherError" class="alert alert-secondary small">Weather unavailable: {{ weatherError }}</div>
        <div v-else-if="weather" class="card"><div class="card-body">
          <p class="mb-2">
            <strong>{{ weather.current.temperature_2m }} °C</strong> now ·
            wind {{ weather.current.wind_speed_10m }} km/h ·
            humidity {{ weather.current.relative_humidity_2m }}% ·
            rain {{ weather.current.precipitation }} mm
          </p>
          <table class="table table-sm mb-0">
            <thead><tr><th>Date</th><th>High</th><th>Low</th><th>Rain</th></tr></thead>
            <tbody>
              <tr v-for="day in weather.days" :key="day.date">
                <td>{{ formatDate(day.date) }}</td><td>{{ day.max }} °C</td>
                <td>{{ day.min }} °C</td><td>{{ day.rain }} mm</td>
              </tr>
            </tbody>
          </table>
        </div></div>
      </section>

      <!-- Feature 2: checklist -->
      <section class="mb-4">
        <h2 class="h5">Gear checklist</h2>
        <div v-if="!auth.isLoggedIn" class="alert alert-secondary">Sign in to generate a checklist.</div>
        <div v-else>
          <button class="btn btn-sm btn-outline-primary mb-2" :disabled="checklistStore.loading" @click="generateChecklist">
            {{ checklistStore.items.length ? 'Regenerate' : 'Generate checklist' }}
          </button>

          <ul v-if="checklistStore.items.length" class="list-group mb-2">
            <li v-for="item in checklistStore.items" :key="item.id" class="list-group-item d-flex align-items-start gap-2">
              <input class="form-check-input mt-1" type="checkbox" :checked="item.is_checked" @change="checklistStore.toggle(item)" />
              <div class="flex-grow-1">
                <span :class="{ 'text-decoration-line-through text-muted': item.is_checked }">
                  {{ item.label }} <span v-if="item.quantity" class="text-muted">— {{ item.quantity }}</span>
                </span>
                <div v-if="item.reason" class="small text-muted">{{ item.reason }}</div>
              </div>
              <button class="btn btn-sm btn-link text-danger p-0" @click="checklistStore.removeItem(item.id)">remove</button>
            </li>
          </ul>

          <form v-if="checklistStore.checklist" class="d-flex gap-2" @submit.prevent="checklistStore.addCustom(customItem); customItem = ''">
            <input v-model="customItem" class="form-control form-control-sm" placeholder="Add your own item" required />
            <button class="btn btn-sm btn-secondary" type="submit">Add</button>
          </form>
        </div>
      </section>

      <!-- Feature 5: itinerary -->
      <section class="mb-4">
        <h2 class="h5">Day by day</h2>
        <p v-if="!routesStore.itineraryDays.length" class="text-muted small">
          No itinerary has been added for this route yet.
        </p>
        <div v-for="day in routesStore.itineraryDays" :key="day.id" class="card mb-2"><div class="card-body">
          <h3 class="h6">Day {{ day.day_number }}</h3>
          <p class="small mb-1">
            {{ day.distance_km }} km · +{{ day.elevation_gain_m }} m / −{{ day.elevation_loss_m }} m ·
            {{ day.estimated_hours }} h
          </p>
          <p v-if="day.overnight_stop" class="small mb-1">
            Overnight: {{ day.overnight_stop }}
            <span v-if="day.overnight_altitude_m">({{ day.overnight_altitude_m }} m)</span>
            <span v-if="day.facilities"> · {{ day.facilities }}</span>
          </p>
          <div v-for="w in routesStore.warningsForDay(day.day_number)" :key="w.point_id + w.category" class="alert alert-warning py-2 small mb-0 mt-2">
            <strong>{{ w.label }}</strong> at {{ w.point_name }} — reported by {{ w.reporter_count }} hikers.
            Latest: "{{ w.latest_note }}"
          </div>
        </div></div>

        <details v-if="routesStore.points.length" class="mb-2">
          <summary class="small text-muted">Checkpoints on this route ({{ routesStore.points.length }})</summary>
          <ul class="small mt-2">
            <li v-for="p in routesStore.points" :key="p.id">
              {{ p.name }} <span class="text-muted">— {{ p.point_type }}<span v-if="p.altitude_m">, {{ p.altitude_m }} m</span></span>
            </li>
          </ul>
        </details>
      </section>

      <!-- Feature 4: reviews -->
      <section>
        <h2 class="h5">Community reviews</h2>

        <div class="row g-3 mb-3">
          <div class="col-md-4"><div class="card text-center p-3">
            <small class="text-muted">Route quality</small>
            <strong class="fs-4">{{ route.avg_rating ?? '—' }}</strong>
            <small class="text-muted">{{ route.review_count }} review(s)</small>
          </div></div>
          <div class="col-md-4"><div class="card text-center p-3">
            <small class="text-muted">Completion rate</small>
            <strong class="fs-4">
              {{ route.completion_rate !== null ? Math.round(route.completion_rate * 100) + '%' : '—' }}
            </strong>
          </div></div>
          <div class="col-md-4"><div class="card text-center p-3">
            <small class="text-muted">Felt difficulty</small>
            <strong class="fs-4">{{ route.avg_perceived_difficulty ?? '—' }}</strong>
            <small class="text-muted">official {{ route.official_difficulty }}</small>
          </div></div>
        </div>

        <div v-if="divergence !== 0" class="alert alert-info small">
          Hikers rate this route
          {{ divergence > 0 ? 'harder' : 'easier' }} than its official
          {{ difficultyLabel(route.official_difficulty) }} grade. Effective difficulty is now
          {{ route.effective_difficulty }} ({{ difficultyLabel(route.effective_difficulty) }}), and that is what the
          difficulty match uses.
        </div>

        <!-- Write / edit -->
        <div v-if="!auth.isLoggedIn" class="alert alert-secondary">
          <RouterLink to="/auth">Sign in</RouterLink> to leave a review.
        </div>
        <div v-else class="card mb-3"><div class="card-body">
          <h3 class="h6">{{ myReview ? 'Edit your review' : 'Write a review' }}</h3>
          <form @submit.prevent="submitReview">
            <div class="row g-2 mb-2">
              <div class="col-sm-4">
                <label class="form-label small" for="rating">Quality (1–5)</label>
                <select id="rating" v-model.number="form.rating" class="form-select form-select-sm">
                  <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
                </select>
              </div>
              <div class="col-sm-4">
                <label class="form-label small" for="felt">How hard did it feel?</label>
                <select id="felt" v-model.number="form.perceivedDifficulty" class="form-select form-select-sm">
                  <option :value="1">Easy</option><option :value="2">Moderate</option>
                  <option :value="3">Hard</option><option :value="4">Strenuous</option>
                </select>
              </div>
              <div class="col-sm-4">
                <label class="form-label small" for="completed">Did you finish?</label>
                <select id="completed" v-model="form.completed" class="form-select form-select-sm">
                  <option :value="true">Completed</option>
                  <option :value="false">Did not complete</option>
                </select>
              </div>
            </div>

            <textarea v-model="form.reviewText" class="form-control form-control-sm mb-2" rows="3" placeholder="How was it?"></textarea>

            <div v-for="(incident, index) in form.incidents" :key="index" class="row g-2 mb-2 align-items-end">
              <div class="col-sm-3">
                <label class="form-label small">Incident</label>
                <select v-model="incident.category" class="form-select form-select-sm">
                  <option v-for="c in reviewsStore.categories" :key="c.category" :value="c.category">{{ c.label }}</option>
                </select>
              </div>
              <div class="col-sm-3">
                <label class="form-label small">Where</label>
                <select v-model="incident.pointId" class="form-select form-select-sm">
                  <option :value="null">Not specific</option>
                  <option v-for="p in routesStore.points" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
              </div>
              <div class="col-sm-5">
                <input v-model="incident.note" class="form-control form-control-sm" placeholder="What happened?" />
              </div>
              <div class="col-sm-1">
                <button type="button" class="btn btn-sm btn-link text-danger p-0" @click="form.incidents.splice(index, 1)">×</button>
              </div>
            </div>

            <button v-if="form.incidents.length < 3" type="button" class="btn btn-sm btn-outline-secondary me-2" @click="addIncident">
              Flag an incident
            </button>
            <button class="btn btn-sm btn-success me-2" :disabled="saving" type="submit">
              {{ myReview ? 'Update review' : 'Submit review' }}
            </button>
            <button v-if="myReview" class="btn btn-sm btn-outline-danger" type="button" @click="deleteReview">Delete</button>
          </form>
          <div v-if="formError" class="alert alert-danger mt-2 mb-0 small">{{ formError }}</div>
        </div></div>

        <!-- List -->
        <div v-for="review in reviewsStore.reviews" :key="review.id" class="card mb-2"><div class="card-body">
          <div class="d-flex justify-content-between">
            <strong>{{ review.profiles?.display_name || 'Hiker' }}</strong>
            <span>{{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}</span>
          </div>
          <p class="small text-muted mb-2">
            {{ formatDate(review.created_at) }} ·
            Felt {{ difficultyLabel(review.perceived_difficulty) }} ·
            {{ review.completed ? 'Completed' : 'Did not complete' }}
          </p>
          <p class="mb-2">{{ review.review_text }}</p>
          <div v-for="incident in review.review_incidents" :key="incident.id" class="alert alert-warning py-1 px-2 small mb-1">
            <strong>{{ incident.category }}</strong>
            <span v-if="incident.route_points"> at {{ incident.route_points.name }}</span> — {{ incident.note }}
          </div>
        </div></div>

        <p v-if="!reviewsStore.reviews.length" class="text-muted small">No reviews yet.</p>
      </section>
    </div>
  </div>
</template>
