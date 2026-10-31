<script setup>
import { computed } from 'vue'
import { motion, useReducedMotion } from 'motion-v'
import DifficultyMark from '@/components/common/DifficultyMark.vue'
import { GRADES } from '@/lib/difficultyStyle'
import { difficultyColour } from '@/lib/globe/globeRoutes'

// A square label on the globe: a route's name with its grade shape in the grade's heat colour,
// or the number of routes in a group of nearby routes.
// Listeners set on <RoutePill> (like @click and @mouseenter) go straight to this button,
// because Vue passes attributes and listeners a component doesn't declare to its root element.
const props = defineProps({
  label: { type: String, required: true },
  // 1-4, or null when the route is not rated; not used for a group
  grade: { type: Number, default: null },
  isGroup: { type: Boolean, default: false },
  // Hidden until the user starts exploring, and during the dive onto a route
  isVisible: { type: Boolean, default: true },
})

const reduceMotion = useReducedMotion()

// Bright heat colour, as the pill is ink (DESIGN.md, "The Two Heats Rule")
const shapeColour = computed(() => difficultyColour(props.grade))
// The shape's colour when the pill turns light on hover
const lightShapeColour = computed(() => GRADES[props.grade]?.ink ?? 'var(--granite-500)')
// A bigger square for a big group
const isBigGroup = computed(() => props.isGroup && Number(props.label) >= 20)
</script>

<template>
  <motion.button
    type="button"
    class="map-pill"
    :class="{ 'is-group': isGroup, 'is-big': isBigGroup }"
    :style="{ '--light-shape': lightShapeColour, pointerEvents: isVisible ? 'auto' : 'none' }"
    :initial="false"
    :animate="{ opacity: isVisible ? 1 : 0 }"
    :transition="{ duration: reduceMotion ? 0 : isVisible ? 1.2 : 0.3 }"
  >
    <DifficultyMark v-if="!isGroup" :grade="grade" :color="shapeColour" :show-label="false" />
    <span class="map-pill-label">{{ label }}</span>
  </motion.button>
</template>

<style scoped>
/* 28px tall so a stack of pills (32px apart, see assignMarkerStacks) keeps a small gap.
   Only the colours and opacity animate: MapLibre moves each marker with an inline transform,
   and animating that would make the pills trail behind the globe. */
.map-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 28px;
  padding: 0 10px 0 8px;
  border: 0;
  border-radius: 0;
  background: var(--ink);
  color: var(--ground);
  font: 700 12px var(--font);
  white-space: nowrap;
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.35);
  cursor: pointer;
  transition:
    background-color 0.15s var(--ease),
    color 0.15s var(--ease);
}

/* Turns light, so its shape changes to heat ink (DESIGN.md, "The Two Heats Rule"). The shape's
   colour is set inline by DifficultyMark, so this needs !important. */
.map-pill:hover,
.map-pill.is-active {
  background: var(--ground);
  color: var(--ink);
}

.map-pill:hover :deep(.difficulty-mark),
.map-pill.is-active :deep(.difficulty-mark) {
  color: var(--light-shape) !important;
}

.map-pill:focus-visible {
  outline: 3px solid var(--glacier);
  outline-offset: 2px;
}

.map-pill-label {
  max-width: 25ch;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* A group of routes: a bigger outlined square with the count */
.map-pill.is-group {
  justify-content: center;
  min-width: 44px;
  height: 44px;
  padding: 0 10px;
  border: 2px solid var(--ground);
  background: rgb(16 24 20 / 0.82);
  font: 600 15px var(--font-data);
  font-variant-numeric: tabular-nums;
}

.map-pill.is-group.is-big {
  min-width: 56px;
  height: 56px;
  font-size: 18px;
}

.map-pill.is-group:hover {
  background: var(--ground);
  color: var(--ink);
}

.map-pill.is-group .map-pill-label {
  max-width: none;
}
</style>
