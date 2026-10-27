<script setup>
// A small label on the globe: a route's distance with a dot in its difficulty colour,
// or "N routes" for a group of nearby routes (no dot).
// Listeners set on <RoutePill> (like @click and @mouseenter) go straight to this button,
// because Vue passes attributes and listeners a component doesn't declare to its root element.
defineProps({
  label: { type: String, required: true },
  // Difficulty colour for the dot; left out for a group of routes
  dotColour: { type: String, default: '' },
})
</script>

<template>
  <button type="button" class="map-pill">
    <span v-if="dotColour" class="map-pill-dot" :style="{ background: dotColour }"></span>
    {{ label }}
  </button>
</template>

<style scoped>
.map-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.55rem;
  border: 0;
  border-radius: 999px;
  background: #ffffff;
  color: #111827;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: opacity 1.2s ease;
}

.map-pill:hover {
  background: #111827;
  color: #ffffff;
}

.map-pill-dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
}
</style>
