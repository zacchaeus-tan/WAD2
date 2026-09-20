<script setup>
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useRoutesStore } from '@/stores/routes'

const route = useRoute()
const routesStore = useRoutesStore()

onMounted(() => {
  routesStore.fetchRouteById(route.params.id)
})

// refetch if the id in the URL changes (e.g. navigating from one route detail to another)
watch(
  () => route.params.id,
  (newId) => {
    if (newId) routesStore.fetchRouteById(newId)
  }
)
</script>

<template>
  <div class="container py-4">
    <div v-if="routesStore.loading" class="text-center py-5">
      <div class="spinner-border" role="status"></div>
    </div>

    <div v-else-if="routesStore.error" class="alert alert-danger">
      Failed to load route: {{ routesStore.error }}
    </div>

    <div v-else-if="routesStore.currentRoute">
      <h1>{{ routesStore.currentRoute.name }}</h1>
      <p class="text-muted">{{ routesStore.currentRoute.country }}</p>

      <!-- Safety status banner -->
      <div
        v-if="routesStore.currentRoute.safety_status !== 'open'"
        class="alert"
        :class="{
          'alert-warning': routesStore.currentRoute.safety_status === 'caution',
          'alert-danger': routesStore.currentRoute.safety_status === 'closed',
        }"
      >
        <strong>{{ routesStore.currentRoute.safety_status.toUpperCase() }}</strong>
        <span v-if="routesStore.currentRoute.safety_status_note">
          — {{ routesStore.currentRoute.safety_status_note }}
        </span>
      </div>

      <!-- Key stats -->
      <div class="row g-3 my-3">
        <div class="col-6 col-md-3">
          <div class="card text-center p-2">
            <small class="text-muted">Distance</small>
            <strong>{{ routesStore.currentRoute.distance_km }} km</strong>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card text-center p-2">
            <small class="text-muted">Elevation Gain</small>
            <strong>{{ routesStore.currentRoute.elevation_gain_m }} m</strong>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card text-center p-2">
            <small class="text-muted">Duration</small>
            <strong>{{ routesStore.currentRoute.duration_days }} day(s)</strong>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card text-center p-2">
            <small class="text-muted">Max Altitude</small>
            <strong>{{ routesStore.currentRoute.altitude_m }} m</strong>
          </div>
        </div>
      </div>

      <!-- Permit / guide info -->
      <div class="mb-4">
        <span v-if="routesStore.currentRoute.permit_required" class="badge bg-info text-dark me-2">
          Permit required
        </span>
        <span v-if="routesStore.currentRoute.guide_required" class="badge bg-info text-dark">
          Guide required
        </span>
      </div>

      <!-- Itinerary -->
      <h2 class="h4 mt-4 mb-3">Day-by-Day Itinerary</h2>
      <div v-if="routesStore.itineraryDays.length === 0" class="text-muted">
        No day-by-day breakdown available for this route.
      </div>

      <div v-else class="accordion" id="itineraryAccordion">
        <div
          v-for="day in routesStore.itineraryDays"
          :key="day.id"
          class="accordion-item"
        >
          <h2 class="accordion-header">
            <button
              class="accordion-button collapsed"
              type="button"
              data-bs-toggle="collapse"
              :data-bs-target="`#day-${day.day_number}`"
            >
              Day {{ day.day_number }}
              <span class="text-muted ms-2 small">
                {{ day.distance_km }} km · +{{ day.elevation_gain_m }}m / −{{ day.elevation_loss_m }}m
              </span>
            </button>
          </h2>
          <div
            :id="`day-${day.day_number}`"
            class="accordion-collapse collapse"
            data-bs-parent="#itineraryAccordion"
          >
            <div class="accordion-body">
              <p><strong>Estimated time:</strong> {{ day.estimated_hours }} hours</p>
              <p v-if="day.overnight_stop">
                <strong>Overnight:</strong> {{ day.overnight_stop }}
                <span v-if="day.overnight_altitude_m">({{ day.overnight_altitude_m }}m)</span>
              </p>
              <p v-if="day.facilities"><strong>Facilities:</strong> {{ day.facilities }}</p>
              <p v-if="day.notes">{{ day.notes }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Placeholder anchors for teammates' features -->
      <div class="mt-5">
        <div id="difficulty-match-section"></div>
        <div id="weather-safety-section"></div>
        <div id="gear-checklist-section"></div>
        <div id="reviews-section"></div>
      </div>
    </div>
  </div>
</template>