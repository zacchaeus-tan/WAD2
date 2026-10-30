<script setup>
import { ref } from 'vue'
import { motion, useReducedMotion } from 'motion-v'
import DifficultyMark from '@/components/common/DifficultyMark.vue'
import TrailPlank from './TrailPlank.vue'

// The route index over the globe once exploring, as a trailhead notice board: how many routes
// are shown, any errors, fingerposts for the countries to fly to, the difficulty key and the
// Map/Satellite switch (used with v-model:satellite). On phones it folds into a bar along the bottom.
defineProps({
  routeCount: { type: Number, required: true },
  shownCount: { type: Number, required: true },
  // Routes with no location, so no pill on the globe
  missingRoutes: { type: Array, default: () => [] },
  // { name, count } for each country with routes on the globe, from countrySummaries()
  countries: { type: Array, default: () => [] },
  // Name of the country the globe last flew to, highlighted in the list
  selectedCountry: { type: String, default: '' },
  error: { type: String, default: '' },
  mapError: { type: String, default: '' },
  satellite: { type: Boolean, required: true },
})

const emit = defineEmits(['update:satellite', 'fly-to'])

const reduceMotion = useReducedMotion()
// Slides in from the left, or rises from the bottom on phones. Same width as the phone styles below.
const startOffset = window.matchMedia('(max-width: 640px)').matches ? { y: 16 } : { x: -16 }

// The four grades plus "Not rated" (null) for the key
const grades = [1, 2, 3, 4, null]

// Only used on phones, where the index starts folded away
const isOpen = ref(false)

function flyTo(countryName) {
  emit('fly-to', countryName)
  // Get the sheet out of the way so the user can see where the globe went
  isOpen.value = false
}
</script>

<template>
  <motion.aside
    class="cairn globe-panel"
    :class="{ 'is-open': isOpen }"
    aria-label="Route index"
    data-testid="globe-panel"
    :initial="{ opacity: 0, ...startOffset }"
    :animate="{ opacity: 1, x: 0, y: 0 }"
    :transition="{
      duration: reduceMotion ? 0 : 0.6,
      delay: reduceMotion ? 0 : 0.3,
      ease: [0.16, 1, 0.3, 1],
    }"
  >
    <span class="globe-panel-roof" aria-hidden="true"></span>
    <button
      type="button"
      class="globe-panel-toggle"
      :aria-expanded="isOpen ? 'true' : 'false'"
      aria-controls="globe-panel-body"
      data-testid="globe-panel-toggle"
      @click="isOpen = !isOpen"
    >
      <span
        ><span class="cairn-data">{{ shownCount }}</span> routes</span
      >
      <span class="globe-panel-toggle-label">
        Trail board
        <motion.svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          :initial="false"
          :animate="{ rotate: isOpen ? 45 : 0 }"
          :transition="{ duration: reduceMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }"
        >
          <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.2" />
        </motion.svg>
      </span>
    </button>

    <div id="globe-panel-body" class="globe-panel-body" aria-live="polite">
      <div class="globe-panel-head">
        <h2>Trailhead board</h2>
        <p v-if="!error" class="cairn-data" data-testid="globe-route-count">
          {{ shownCount }} of {{ routeCount }} routes · {{ countries.length }}
          {{ countries.length === 1 ? 'country' : 'countries' }}
        </p>
      </div>

      <p v-if="error" class="globe-error" role="alert">{{ error }}</p>
      <p v-if="mapError" class="globe-error" role="alert">{{ mapError }}</p>

      <template v-if="!error">
        <p v-if="!routeCount" class="cairn-fine">No routes are available right now.</p>

        <template v-if="countries.length">
          <p class="cairn-label">This way to</p>
          <ol class="globe-countries">
            <li v-for="(country, index) in countries" :key="country.name">
              <TrailPlank
                :class="{ 'is-short': index % 2 === 1 }"
                :aria-pressed="country.name === selectedCountry ? 'true' : 'false'"
                data-testid="globe-country-button"
                @click="flyTo(country.name)"
              >
                <span>{{ country.name }}</span>
                <span class="cairn-data globe-country-count">
                  {{ country.count }}
                  <span class="cairn-visually-hidden">routes</span>
                </span>
              </TrailPlank>
            </li>
          </ol>
        </template>

        <details v-if="missingRoutes.length" class="globe-missing">
          <summary>
            {{ missingRoutes.length }} route{{ missingRoutes.length === 1 ? '' : 's' }}
            missing a location
          </summary>
          <ul>
            <li v-for="route in missingRoutes" :key="route.id">
              {{ route.name || route.id }}
            </li>
          </ul>
        </details>
      </template>

      <p class="cairn-label">Trail blazes</p>
      <ul class="globe-key" aria-label="Route difficulty">
        <li v-for="grade in grades" :key="grade ?? 'not-rated'">
          <!-- "Not rated" has no grade colour of its own -->
          <DifficultyMark :grade="grade" :color="grade ? '' : 'var(--granite-500)'" />
        </li>
      </ul>

      <p id="globe-map-type" class="cairn-label">Map</p>
      <div class="globe-switch" role="group" aria-labelledby="globe-map-type">
        <button
          type="button"
          :aria-pressed="!satellite"
          data-testid="globe-map-view-button"
          @click="emit('update:satellite', false)"
        >
          Map
        </button>
        <button
          type="button"
          :aria-pressed="satellite"
          data-testid="globe-satellite-view-button"
          @click="emit('update:satellite', true)"
        >
          Satellite
        </button>
      </div>
    </div>
  </motion.aside>
</template>

<style scoped>
/* A paper sheet in a wooden frame, floating over the globe, so it gets the panel shadow
   (DESIGN.md: shadows are for things that float). Sits below the navbar, which overlays the globe. */
.globe-panel {
  position: absolute;
  top: calc(var(--nav-height) + 34px);
  left: var(--gutter);
  z-index: 3;
  display: flex;
  flex-direction: column;
  width: 312px;
  max-height: calc(100% - var(--nav-height) - 74px);
  padding: 9px;
  background-color: var(--wood-dark);
  background-image: var(--wood-grain);
  box-shadow: var(--shadow-panel);
}

/* Two legs running down off the bottom of the screen */
.globe-panel::before,
.globe-panel::after {
  content: '';
  position: absolute;
  top: 100%;
  width: 14px;
  height: 100vh;
  background: linear-gradient(90deg, #6a5339, var(--wood-dark) 60%, #47382a);
}

.globe-panel::before {
  left: 34px;
}

.globe-panel::after {
  right: 34px;
}

.globe-panel-roof {
  position: absolute;
  right: -14px;
  bottom: 100%;
  left: -14px;
  height: 20px;
  background-color: #3f3226;
  background-image: repeating-linear-gradient(90deg, rgb(0 0 0 / 0.22) 0 2px, transparent 2px 16px);
  clip-path: polygon(3% 0, 97% 0, 100% 100%, 0 100%);
}

.globe-panel-toggle {
  display: none;
}

.globe-panel-body {
  display: grid;
  gap: 10px;
  padding: 18px 18px 20px;
  overflow-y: auto;
  background: var(--paper);
  color: var(--ink);
}

.globe-panel-head {
  display: grid;
  gap: 4px;
  padding-bottom: 12px;
  margin-bottom: 2px;
  border-bottom: 2px solid var(--ink);
}

.globe-panel-head h2 {
  font-size: 22px;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.globe-panel-head p {
  font-size: 13px;
  color: var(--granite-700);
}

.globe-error {
  font-size: 14px;
  line-height: 20px;
  color: #b42318;
}

.globe-countries {
  position: relative;
  display: grid;
  gap: 4px;
  margin: 0;
  padding: 0 0 0 7px;
  list-style: none;
}

/* The post all the fingerposts are nailed to */
.globe-countries::before {
  content: '';
  position: absolute;
  top: -6px;
  bottom: -6px;
  left: 14px;
  width: 8px;
  background: var(--wood-dark);
}

.globe-countries .trail-plank {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  width: 100%;
  height: 30px;
  padding: 0 22px 0 12px;
  font-size: 13px;
  text-align: left;
}

.globe-countries .trail-plank.is-short {
  width: 94%;
}

.globe-countries .trail-plank:hover {
  background-color: var(--wood-light);
}

.globe-countries .trail-plank[aria-pressed='true'] {
  background-color: var(--pine);
}

.globe-country-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--sand);
}

.globe-missing {
  font-size: 14px;
  line-height: 20px;
  color: var(--granite-700);
}

.globe-missing summary {
  cursor: pointer;
  font-weight: 700;
}

.globe-missing ul {
  margin: 8px 0 0;
  padding-left: 18px;
}

.globe-key {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 12px;
  margin: 0 0 4px;
  padding: 0;
  list-style: none;
  font-size: 13px;
}

.globe-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 2px solid var(--ink);
}

.globe-switch button {
  min-height: 40px;
  border: 0;
  background: none;
  color: var(--ink);
  font: 700 12px var(--font);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}

.globe-switch button[aria-pressed='true'] {
  background: var(--ink);
  color: var(--ground);
}

.globe-switch button:focus-visible,
.globe-panel-toggle:focus-visible {
  outline: 3px solid var(--lake);
  outline-offset: -3px;
}

/* On phones the index folds into a bar along the bottom and opens upwards as a sheet */
@media (max-width: 640px) {
  .globe-panel {
    top: auto;
    right: 0;
    bottom: 0;
    left: 0;
    width: auto;
    max-height: 70%;
    padding: 0;
  }

  /* The open sheet covers the compass and zoom buttons */
  .globe-panel.is-open {
    z-index: 4;
  }

  .globe-panel::before,
  .globe-panel::after,
  .globe-panel-roof {
    display: none;
  }

  .globe-panel-toggle {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 52px;
    padding: 0 16px;
    border: 0;
    background: none;
    color: var(--paper);
    font: 700 14px var(--font);
    text-shadow: 0 1px 0 rgb(0 0 0 / 0.35);
    cursor: pointer;
  }

  .globe-panel-toggle-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .globe-panel-toggle svg {
    width: 18px;
    height: 18px;
  }

  .globe-panel-body {
    display: none;
  }

  .globe-panel.is-open .globe-panel-body {
    display: grid;
  }

  .globe-panel-head h2 {
    display: none;
  }
}
</style>
