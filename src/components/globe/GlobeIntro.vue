<script setup>
import { computed } from 'vue'

// Title screen over the globe: a loading bar while the globe and routes load ('intro'),
// then a "Scroll to explore" button ('hero'). Fades away once the user explores.
const props = defineProps({
  phase: { type: String, required: true },
  // Each step is { label, done }; the bar fills as steps finish
  loadingSteps: { type: Array, required: true },
  // Shown once every step is done, e.g. "Ready: 247 routes found"
  readyMessage: { type: String, required: true },
})

const emit = defineEmits(['explore'])

const titleLetters = 'CAIRN'.split('')

const loadingProgress = computed(() => {
  const doneCount = props.loadingSteps.filter((step) => step.done).length
  return Math.round((doneCount / props.loadingSteps.length) * 100)
})

const loadingMessage = computed(() => {
  const nextStep = props.loadingSteps.find((step) => !step.done)
  return nextStep ? `${nextStep.label}...` : props.readyMessage
})
</script>

<template>
  <section class="globe-intro" :class="{ 'is-hidden': phase === 'explore' }" :aria-hidden="phase === 'explore'">
    <h1 class="globe-title" aria-label="CAIRN">
      <!-- The letters never change or move, so their position is a safe key -->
      <span
        v-for="(letter, index) in titleLetters"
        :key="index"
        class="globe-title-letter"
        :style="{ animationDelay: `${index * 0.12}s` }"
        aria-hidden="true"
        >{{ letter }}</span
      >
    </h1>
    <p class="globe-tagline">Find your next trail, anywhere on Earth</p>

    <div v-if="phase === 'intro'" class="globe-loading" data-testid="globe-loading">
      <div
        class="progress"
        role="progressbar"
        aria-label="Loading routes"
        :aria-valuenow="loadingProgress"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div class="progress-bar" :style="{ width: `${loadingProgress}%` }"></div>
      </div>
      <p class="globe-loading-text" role="status">
        {{ loadingMessage }} <span class="globe-loading-percent">{{ loadingProgress }}%</span>
      </p>
    </div>
    <button
      v-else
      type="button"
      class="globe-scroll-cue"
      data-testid="globe-explore-button"
      @click="emit('explore')"
    >
      Scroll to explore
      <span class="globe-scroll-arrow" aria-hidden="true">&darr;</span>
    </button>
  </section>
</template>

<style scoped>
/* Covers the globe so it can't be dragged until the user explores */
.globe-intro {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  text-align: center;
  transition:
    opacity 1s ease,
    transform 1s ease;
}

.globe-intro.is-hidden {
  opacity: 0;
  transform: translateY(-3rem);
  pointer-events: none;
}

.globe-title {
  margin: 0;
  font-size: clamp(3.5rem, 12vw, 7.5rem);
  font-weight: 300;
  letter-spacing: 0.08em;
  line-height: 1;
}

.globe-title-letter {
  display: inline-block;
  opacity: 0;
  animation: letter-rise 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
}

.globe-tagline {
  margin: 0.5rem 0 0;
  font-size: clamp(1rem, 2.5vw, 1.4rem);
  font-weight: 300;
  letter-spacing: 0.06em;
  opacity: 0;
  animation: fade-in 1s ease 0.8s forwards;
}

.globe-loading {
  width: min(18rem, 80vw);
  margin: 2.5rem 0 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  letter-spacing: 0.1em;
}

/* Thin bar on the dark intro, using Bootstrap's progress variables */
.globe-loading .progress {
  --bs-progress-height: 4px;
  --bs-progress-bg: rgba(255, 255, 255, 0.15);
  --bs-progress-bar-bg: #ffffff;
  --bs-progress-bar-transition: width 0.6s ease;
}

.globe-loading-text {
  margin: 0.75rem 0 0;
}

.globe-loading-percent {
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.4);
}

.globe-scroll-cue {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  margin-top: 2.5rem;
  border: 0;
  background: none;
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.9rem;
  letter-spacing: 0.1em;
  animation: fade-in 1s ease forwards;
}

.globe-scroll-cue:hover {
  color: #ffffff;
}

.globe-scroll-arrow {
  font-size: 1.3rem;
  animation: arrow-bob 1.6s ease-in-out infinite;
}

@keyframes letter-rise {
  from {
    opacity: 0;
    transform: translateY(0.4em);
    filter: blur(8px);
  }
  to {
    opacity: 1;
    transform: none;
    filter: blur(0);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes arrow-bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(0.35rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .globe-title-letter,
  .globe-tagline,
  .globe-scroll-cue,
  .globe-scroll-arrow {
    animation: none;
    opacity: 1;
  }
}
</style>
