<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useRoutesStore } from '@/stores/routes'
import { useAuthStore } from '@/stores/auth'
import { generateItinerary } from '@/services/itinerary.service'

const props = defineProps({
  route: { type: Object, required: true },
  weather: { type: Object, default: null },
})

const routesStore = useRoutesStore()
const auth = useAuthStore()
const generated = ref(null)
const loading = ref(false)
const error = ref('')

async function generate() {
  loading.value = true
  error.value = ''
  try {
    generated.value = await generateItinerary(props.route.id, props.weather)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="mb-4">
    <div class="d-flex flex-wrap justify-content-between align-items-start gap-2">
      <div>
        <h2 class="h5 mb-1">Day by day</h2>
        <p class="small text-muted mb-2">Plan your effort around distance, terrain and checkpoints.</p>
      </div>
      <button v-if="auth.isLoggedIn" class="btn btn-sm btn-outline-primary" :disabled="loading" @click="generate">
        {{ loading ? 'Planning…' : generated ? 'Regenerate with AI' : 'Generate with AI' }}
      </button>
    </div>

    <div v-if="!auth.isLoggedIn" class="alert alert-secondary small">
      <RouterLink to="/auth">Sign in</RouterLink> to generate a planning draft with AI.
    </div>
    <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>

    <div v-if="generated" class="card border-primary mb-3">
      <div class="card-body">
        <div class="d-flex justify-content-between gap-2">
          <h3 class="h6 text-primary mb-1">AI-generated planning draft</h3>
          <span class="badge text-bg-light">Advisory</span>
        </div>
        <p class="small mb-2">{{ generated.summary }}</p>
        <div v-for="day in generated.days" :key="`ai-${day.day_number}`" class="border-top pt-2 mt-2">
          <h4 class="h6 mb-1">Day {{ day.day_number }} · {{ day.title }}</h4>
          <p class="small mb-1"><strong>Stage:</strong> {{ day.start_checkpoint }} → {{ day.end_checkpoint }}</p>
          <p v-if="day.checkpoints?.length" class="small text-muted mb-1">Via: {{ day.checkpoints.join(' · ') }}</p>
          <p class="small mb-1">{{ day.distance_km }} km · {{ day.estimated_hours }} h</p>
          <p class="small mb-1"><strong>Overnight:</strong> {{ day.overnight_stop }}</p>

          <div v-if="day.accommodation?.length" class="small mb-2">
            <strong>Accommodation:</strong>
            <div v-for="place in day.accommodation" :key="`${day.day_number}-${place.name}`" class="border-start ps-2 mt-1">
              <div>{{ place.name }} <span v-if="place.type" class="text-muted">({{ place.type }})</span></div>
              <div class="text-muted">{{ place.distance_from_route_km }} km from route</div>
              <div v-if="place.facilities?.length" class="text-muted">Facilities: {{ place.facilities.join(', ') }}</div>
              <div v-if="place.booking_info" class="text-muted">Booking: {{ place.booking_info }}</div>
              <a v-if="place.source_url" :href="place.source_url" target="_blank" rel="noopener noreferrer">View source</a>
            </div>
          </div>
          <p v-else class="small text-muted mb-2">No verified accommodation found.</p>

          <div v-if="day.trail_facilities?.length" class="small mb-2">
            <strong>Facilities along route:</strong>
            <div v-for="facility in day.trail_facilities" :key="`${day.day_number}-${facility.name}-${facility.location}`" class="border-start ps-2 mt-1">
              <div>{{ facility.name }}<span v-if="facility.type">: {{ facility.type }}</span></div>
              <div v-if="facility.location" class="text-muted">{{ facility.location }}</div>
              <a v-if="facility.source_url" :href="facility.source_url" target="_blank" rel="noopener noreferrer">View source</a>
            </div>
          </div>
          <ul v-if="day.highlights.length" class="small mb-1"><li v-for="item in day.highlights" :key="item">{{ item }}</li></ul>
          <p v-for="note in day.notes" :key="note" class="small text-muted mb-1">{{ note }}</p>
        </div>
        <p class="small text-muted mb-0 mt-3"><strong>Safety:</strong> {{ generated.safety_note }}</p>
      </div>
    </div>

    <p v-if="!routesStore.itineraryDays.length" class="text-muted small">No official itinerary has been added for this route yet.</p>
    <div v-for="day in routesStore.itineraryDays" :key="day.id" class="card mb-2"><div class="card-body">
      <h3 class="h6">Day {{ day.day_number }}</h3>
      <p class="small mb-1">{{ day.distance_km }} km · {{ day.estimated_hours }} h</p>
      <p v-if="day.overnight_stop" class="small mb-1">Overnight: {{ day.overnight_stop }}<span v-if="day.overnight_altitude_m"> ({{ day.overnight_altitude_m }} m)</span><span v-if="day.facilities"> · {{ day.facilities }}</span></p>
      <div v-for="w in routesStore.warningsForDay(day.day_number)" :key="w.point_id + w.category" class="alert alert-warning py-2 small mb-0 mt-2"><strong>{{ w.label }}</strong> at {{ w.point_name }} — reported by {{ w.reporter_count }} hikers. Latest: "{{ w.latest_note }}"</div>
    </div></div>

    <details v-if="routesStore.points.length" class="mb-2">
      <summary class="small text-muted">Checkpoints on this route ({{ routesStore.points.length }})</summary>
      <ul class="small mt-2"><li v-for="p in routesStore.points" :key="p.id">{{ p.name }} <span class="text-muted">— {{ p.point_type }}<span v-if="p.altitude_m">, {{ p.altitude_m }} m</span></span></li></ul>
    </details>
  </section>
</template>
