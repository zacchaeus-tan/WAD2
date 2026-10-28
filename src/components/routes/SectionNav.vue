<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { motion } from 'motion-v'

// Sticky pine bar linking to each section, with a sand bar along its bottom that
// fills as you scroll through the sections (the same stretch the trail is drawn over).
defineProps({
  progress: { type: Object, required: true }, // Motion value from 0 to 1, from the page's useScroll
})

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'fit', label: 'Is it for you' },
  { id: 'weather', label: 'Weather' },
  { id: 'plan', label: 'Plan' },
  { id: 'gear', label: 'Gear' },
  { id: 'reviews', label: 'Reviews' },
]

// The section nearest the top of the screen is marked as current
const current = ref('overview')
let observer = null

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          current.value = entry.target.id
        }
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  )
  for (const section of SECTIONS) {
    const element = document.getElementById(section.id)
    if (element) {
      observer.observe(element)
    }
  }
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <nav class="section-nav" aria-label="Sections of this route">
    <div class="cairn-wrap section-nav-links">
      <a
        v-for="section in SECTIONS"
        :key="section.id"
        :href="`#${section.id}`"
        :aria-current="current === section.id ? 'location' : null"
      >
        {{ section.label }}
      </a>
    </div>
    <span class="section-nav-progress" aria-hidden="true">
      <motion.span class="section-nav-progress-fill" :style="{ scaleX: progress }" />
    </span>
  </nav>
</template>

<style scoped>
.section-nav {
  position: sticky;
  top: 0;
  z-index: 10;
  padding-bottom: 5px;
  background: var(--pine);
  color: var(--paper);
}

.section-nav-links {
  display: flex;
  align-items: stretch;
  overflow-x: auto;
  scrollbar-width: none;
}

.section-nav-links::-webkit-scrollbar {
  display: none;
}

.section-nav-links a {
  display: flex;
  align-items: center;
  min-height: 56px;
  padding: 0 18px;
  border-bottom: 3px solid transparent;
  color: #d4e3db;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-decoration: none;
  text-transform: uppercase;
  white-space: nowrap;
}

.section-nav-links a:hover {
  background: var(--pine-deep);
  color: var(--white);
}

.section-nav-links a[aria-current] {
  border-bottom-color: var(--sand);
  color: var(--white);
}

.section-nav-links a:focus-visible {
  outline: 3px solid var(--glacier);
  outline-offset: -3px;
}

/* Sand fill on a dark pine track, so it stays visible against the page below */
.section-nav-progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 5px;
  background: #0f3326;
  pointer-events: none;
}

.section-nav-progress-fill {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 1px;
  background: var(--sand);
  transform-origin: 0 50%;
}
</style>
