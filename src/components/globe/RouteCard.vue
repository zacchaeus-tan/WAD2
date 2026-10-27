<script setup>
import { computed } from 'vue'
import { difficultyColour } from '@/lib/globe/globeRoutes'

// A route's details card, shown in a map popup when a route is hovered or clicked
const props = defineProps({
  // Route details from routeCardDetails() in src/lib/globe/globeRoutes.js
  route: { type: Object, required: true },
  // Only the clicked card has the "View more" button; the hover card is just a preview
  showViewMore: { type: Boolean, default: false },
})

const emit = defineEmits(['view-more'])

const squareColour = computed(() => difficultyColour(props.route.difficulty))
</script>

<template>
  <div class="route-card" data-testid="route-card">
    <p class="route-card-title">{{ route.name }}</p>
    <p class="route-card-location">{{ route.country }}</p>
    <p class="route-card-meta">
      <template v-if="route.ratingLabel">★ {{ route.ratingLabel }} · </template>
      <span class="route-card-square" :style="{ background: squareColour }"></span>
      {{ route.difficultyLabel }}
    </p>
    <p class="route-card-meta">{{ route.distanceLabel }} · Est. {{ route.durationLabel }}</p>
    <button
      v-if="showViewMore"
      type="button"
      class="btn btn-sm btn-dark mt-2"
      data-testid="route-card-view-more"
      @click="emit('view-more')"
    >
      View more
    </button>
  </div>
</template>

<style scoped>
.route-card {
  min-width: 240px;
  padding: 0.75rem 1.75rem 0.75rem 1rem;
}

.route-card-title {
  margin-bottom: 0.15rem;
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.25;
  color: #111827;
}

.route-card-location {
  margin-bottom: 0.3rem;
  color: #6b7280;
}

.route-card-meta {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.15rem;
  color: #374151;
}

.route-card-square {
  width: 0.65rem;
  height: 0.65rem;
  border-radius: 2px;
}
</style>
