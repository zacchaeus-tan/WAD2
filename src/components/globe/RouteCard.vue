<script setup>
import { computed } from 'vue'
import DifficultyMark from '@/components/common/DifficultyMark.vue'
import TrailPlank from './TrailPlank.vue'

// A route's details card, a page of field notes pinned up in a map popup when a route is
// hovered or clicked
const props = defineProps({
  // Route details from routeCardDetails() in src/lib/globe/globeRoutes.js
  route: { type: Object, required: true },
  // Only the clicked card has the close and "Open route" buttons; the hover card is just a preview
  showViewMore: { type: Boolean, default: false },
})

const emit = defineEmits(['view-more', 'close'])

// An empty value is shown as a dash (see the template)
const facts = computed(() => [
  { label: 'Distance', value: props.route.distanceLabel },
  { label: 'Climb', value: props.route.climbLabel },
  { label: 'Duration', value: props.route.durationLabel },
  { label: 'Highest', value: props.route.highestLabel },
])
</script>

<template>
  <article class="cairn route-card" data-testid="route-card">
    <div class="route-card-head">
      <p class="cairn-label">{{ route.country }}</p>
      <button
        v-if="showViewMore"
        type="button"
        class="route-card-close"
        aria-label="Close"
        data-testid="route-card-close"
        @click="emit('close')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2.2" />
        </svg>
      </button>
    </div>

    <h2 class="route-card-name" :title="route.name">{{ route.name }}</h2>

    <div class="route-card-grade">
      <DifficultyMark :grade="route.difficulty" />
      <span v-if="route.ratingLabel" class="route-card-rating cairn-data">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2.5l2.9 6.2 6.8.8-5 4.6 1.3 6.7L12 17.5l-6 3.3 1.3-6.7-5-4.6 6.8-.8z"
            fill="currentColor"
          />
        </svg>
        {{ route.ratingLabel }}
        <span class="cairn-visually-hidden">out of 5</span>
      </span>
      <span v-else class="route-card-muted">No reviews yet</span>
    </div>

    <dl class="route-card-facts">
      <div v-for="fact in facts" :key="fact.label">
        <dt>{{ fact.label }}</dt>
        <dd class="cairn-data">
          <template v-if="fact.value">{{ fact.value }}</template>
          <span v-else aria-label="Not listed">—</span>
        </dd>
      </div>
    </dl>

    <TrailPlank
      v-if="showViewMore"
      class="route-card-open"
      data-testid="route-card-view-more"
      @click="emit('view-more')"
    >
      Open route
    </TrailPlank>
  </article>
</template>

<style scoped>
/* The notepad of the gear sheet, tilted slightly as if pinned up by hand. Its shadow is here
   rather than on the popup so that it tilts with the page. */
.route-card {
  position: relative;
  display: grid;
  gap: 10px;
  width: 320px;
  max-width: calc(100vw - 32px);
  padding: 18px 16px 16px 26px;
  background: var(--notepad);
  box-shadow: var(--shadow-panel);
  transform: rotate(-0.6deg);
}

/* The red margin rule */
.route-card::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 12px;
  width: 1px;
  background: #e5a3a3;
}

/* The tack holding the page up */
.route-card::after {
  content: '';
  position: absolute;
  top: -6px;
  left: 50%;
  width: 14px;
  height: 14px;
  margin-left: -7px;
  border-radius: 50%;
  background: var(--blaze);
  box-shadow:
    inset -2px -2px 0 rgb(0 0 0 / 0.22),
    0 2px 3px rgb(0 0 0 / 0.4);
}

.route-card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  min-height: 20px;
}

.route-card-close {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  margin: -8px -8px -8px 0;
  border: 0;
  background: none;
  color: var(--ink);
  cursor: pointer;
}

.route-card-close:hover {
  background: var(--sand);
}

.route-card-close svg {
  width: 18px;
  height: 18px;
}

/* Clamped at two lines; the full name is in the title (DESIGN.md: never shorter than two lines) */
.route-card-name {
  display: -webkit-box;
  overflow: hidden;
  font-size: 18px;
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: -0.01em;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.route-card-grade {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}

.route-card-rating {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}

/* Blaze is kept for ratings (DESIGN.md, "The Blaze Means Stop Rule") */
.route-card-rating svg {
  width: 14px;
  height: 14px;
  color: var(--blaze);
}

.route-card-muted {
  color: var(--granite-500);
}

.route-card-facts {
  display: grid;
  grid-template-columns: repeat(4, auto);
  justify-content: space-between;
  margin: 0;
  border-top: 1px solid #b8d2e6;
  border-bottom: 1px solid #b8d2e6;
}

.route-card-facts div {
  display: grid;
  gap: 2px;
  padding: 8px 0;
}

.route-card-facts div + div {
  padding-left: 10px;
  border-left: 1px solid #b8d2e6;
}

.route-card-facts dt {
  font-size: 10px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--granite-500);
}

.route-card-facts dd {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.route-card .route-card-open {
  justify-content: center;
  width: 100%;
  height: 42px;
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.route-card-close:focus-visible {
  outline: 3px solid var(--lake);
  outline-offset: 2px;
}

@media (max-width: 640px) {
  .route-card {
    transform: none;
  }
}
</style>
