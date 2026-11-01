<script setup>
import { computed } from 'vue'
import { motion, useReducedMotion } from 'motion-v'
import CairnLoader from '@/components/common/CairnLoader.vue'
import TrailPlank from './TrailPlank.vue'

// Title screen over the globe: a cairn built stone by stone while the globe and routes load
// ('intro'), then a signpost reading "Explore the globe" ('hero'). Fades away once the user explores.
const props = defineProps({
  phase: { type: String, required: true },
  // Each step is { label, done }; the cairn grows as steps finish
  loadingSteps: { type: Array, required: true },
  // Shown once every step is done, e.g. "Ready: 247 routes found"
  readyMessage: { type: String, required: true },
})

const emit = defineEmits(['explore'])

const reduceMotion = useReducedMotion()

const titleLetters = 'CAIRN'.split('')

const loadingProgress = computed(() => {
  const doneCount = props.loadingSteps.filter((step) => step.done).length
  return Math.round((doneCount / props.loadingSteps.length) * 100)
})

const loadingMessage = computed(() => {
  const nextStep = props.loadingSteps.find((step) => !step.done)
  return nextStep ? nextStep.label : props.readyMessage
})
</script>

<template>
  <motion.section
    class="cairn globe-intro"
    :aria-hidden="phase === 'explore'"
    :style="{ pointerEvents: phase === 'explore' ? 'none' : 'auto' }"
    :initial="false"
    :animate="phase === 'explore' ? { opacity: 0, y: -24 } : { opacity: 1, y: 0 }"
    :transition="{ duration: reduceMotion ? 0 : 0.8, ease: [0.16, 1, 0.3, 1] }"
  >
    <h1 class="globe-title" aria-label="CAIRN">
      <!-- The letters never change or move, so their position is a safe key -->
      <motion.span
        v-for="(letter, index) in titleLetters"
        :key="index"
        class="globe-title-letter"
        aria-hidden="true"
        :initial="{ opacity: 0, y: '0.25em' }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{
          duration: reduceMotion ? 0 : 0.9,
          delay: reduceMotion ? 0 : index * 0.1,
          ease: [0.16, 1, 0.3, 1],
        }"
        >{{ letter }}</motion.span
      >
    </h1>
    <motion.p
      class="globe-tagline"
      :initial="{ opacity: 0, y: '0.25em' }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{
        duration: reduceMotion ? 0 : 0.9,
        delay: reduceMotion ? 0 : 0.6,
        ease: [0.16, 1, 0.3, 1],
      }"
    >
      Find your next trail.
    </motion.p>

    <div class="globe-way">
      <CairnLoader :progress="loadingProgress" :message="phase === 'intro' ? loadingMessage : ''" />
      <motion.div
        v-if="phase !== 'intro'"
        class="globe-sign"
        :initial="{ opacity: 0, y: '0.25em' }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: reduceMotion ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] }"
      >
        <TrailPlank big data-testid="globe-explore-button" @click="emit('explore')">
          Explore the globe
        </TrailPlank>
        <span class="globe-sign-post" aria-hidden="true"></span>
      </motion.div>
    </div>
  </motion.section>
</template>

<style scoped>
/* Covers the globe so it can't be dragged until the user explores. .cairn gives the CAIRN
   type, but the intro sits on the dark globe, so it stays see-through with paper text. */
.globe-intro {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: var(--nav-height) var(--gutter) 0;
  background: transparent;
  color: var(--ground);
  text-align: center;
}

.globe-title {
  display: flex;
  font-size: clamp(64px, 14vw, 190px);
  font-weight: 900;
  line-height: 0.9;
  letter-spacing: 0.06em;
  text-shadow: 0 6px 40px rgb(0 0 0 / 0.35);
}

.globe-title-letter {
  display: inline-block;
}

.globe-tagline {
  font-size: clamp(17px, 1.6vw, 20px);
  font-weight: 700;
  color: var(--lichen);
}

/* A fixed height, so the title doesn't jump when the loading text becomes the signpost */
.globe-way {
  display: grid;
  justify-items: center;
  align-content: start;
  gap: 8px;
  min-height: 180px;
  margin-top: 8px;
}

/* drop-shadow follows the plank's point, which a box-shadow couldn't */
.globe-sign {
  display: grid;
  justify-items: center;
  filter: drop-shadow(0 6px 10px rgb(0 0 0 / 0.5));
}

.globe-sign-post {
  width: 10px;
  height: 26px;
  background: linear-gradient(90deg, #6a5339, var(--wood-dark) 60%, #47382a);
}
</style>
