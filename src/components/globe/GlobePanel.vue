<script setup>
// Floating panel over the globe once exploring: how many routes are shown, any errors,
// the difficulty colour legend and the Map/Satellite switch (used with v-model:satellite).
defineProps({
  routeCount: { type: Number, required: true },
  shownCount: { type: Number, required: true },
  // Routes with no location, so no pill on the globe
  missingRoutes: { type: Array, default: () => [] },
  error: { type: String, default: '' },
  mapError: { type: String, default: '' },
  satellite: { type: Boolean, required: true },
})

const emit = defineEmits(['update:satellite'])
</script>

<template>
  <aside class="globe-panel" aria-live="polite" data-testid="globe-panel">
    <h2 class="globe-panel-title">Routes around the globe</h2>
    <p v-if="error" class="globe-error" role="alert">{{ error }}</p>
    <p v-if="mapError" class="globe-error" role="alert">{{ mapError }}</p>
    <template v-if="!error">
      <p class="mb-2" data-testid="globe-route-count">
        Showing <strong>{{ shownCount }}</strong> of <strong>{{ routeCount }}</strong> routes. Hover
        over a route to see its details, or click it to view more.
      </p>
      <details v-if="missingRoutes.length" class="missing-routes">
        <summary>
          {{ missingRoutes.length }} route{{ missingRoutes.length === 1 ? '' : 's' }}
          missing a location
        </summary>
        <ul class="mb-0">
          <li v-for="route in missingRoutes" :key="route.id">
            {{ route.name || route.id }}
          </li>
        </ul>
      </details>
      <p v-else-if="!routeCount" class="mb-2">No routes are available right now.</p>
    </template>

    <ul class="difficulty-legend" aria-label="Route difficulty colors">
      <li><span class="legend-swatch difficulty-easy"></span>Easy</li>
      <li><span class="legend-swatch difficulty-moderate"></span>Moderate</li>
      <li><span class="legend-swatch difficulty-hard"></span>Hard</li>
      <li><span class="legend-swatch difficulty-strenuous"></span>Strenuous</li>
    </ul>

    <div class="btn-group btn-group-sm mt-3" role="group" aria-label="Map type">
      <button
        type="button"
        class="btn"
        :class="satellite ? 'btn-outline-light' : 'btn-light'"
        :aria-pressed="!satellite"
        data-testid="globe-map-view-button"
        @click="emit('update:satellite', false)"
      >
        Map
      </button>
      <button
        type="button"
        class="btn"
        :class="satellite ? 'btn-light' : 'btn-outline-light'"
        :aria-pressed="satellite"
        data-testid="globe-satellite-view-button"
        @click="emit('update:satellite', true)"
      >
        Satellite
      </button>
    </div>
  </aside>
</template>

<style scoped>
.globe-panel {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 3;
  width: min(22rem, calc(100% - 2rem));
  padding: 1rem 1.25rem;
  border-radius: 1rem;
  background: rgba(17, 24, 39, 0.85);
  font-size: 0.9rem;
  animation: fade-in 1s ease 1s both;
}

.globe-panel-title {
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.missing-routes {
  margin-bottom: 0.75rem;
}

.missing-routes ul {
  margin-top: 0.5rem;
}

.globe-error {
  color: #fca5a5;
}

.difficulty-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.difficulty-legend li {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.legend-swatch {
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
}

/* Same colours as difficultyColours in src/lib/globe/globeRoutes.js */
.difficulty-easy {
  background: #24883b;
}

.difficulty-moderate {
  background: #e6b700;
}

.difficulty-hard {
  background: #ec741c;
}

.difficulty-strenuous {
  background: #cb3030;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* On phones the panel moves to the bottom so it doesn't cover the middle of the globe */
@media (max-width: 575px) {
  .globe-panel {
    top: auto;
    bottom: 1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .globe-panel {
    animation: none;
    opacity: 1;
  }
}
</style>
