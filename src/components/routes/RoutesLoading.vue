<script setup>
import PlaceholderLine from './PlaceholderLine.vue'

// Shown on browse while the routes load. The pine strip stands where the filter bar
// will be, with a loading bar along its bottom; below it, empty tiles draw their trails.
// The loading time is unknown (the controller gives no progress), so the bar keeps moving.
const TILE_COUNT = 12
</script>

<template>
  <div class="routes-loading">
    <div class="routes-loading-bar">
      <div class="cairn-wrap routes-loading-inner">
        <p class="routes-loading-status" role="status">
          <span class="routes-loading-label">Routes</span>
          <span class="routes-loading-value">Loading…</span>
        </p>
      </div>
      <span class="routes-loading-track" aria-hidden="true"><span class="routes-loading-runner"></span></span>
    </div>

    <div class="cairn-wrap routes-loading-tiles" aria-hidden="true">
      <div v-for="n in TILE_COUNT" :key="n" class="routes-loading-tile" :style="{ '--tile-delay': `${(n - 1) * 0.12}s` }">
        <span class="routes-loading-field">
          <span class="routes-loading-line"><PlaceholderLine color="rgb(242 239 234 / 0.4)" /></span>
          <span class="routes-loading-chip"></span>
        </span>
        <span class="routes-loading-name"></span>
        <span class="routes-loading-facts"></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Pine strip in the filter bar's place, so the banner's pine fade still lands on pine */
.routes-loading-bar {
  position: relative;
  background: var(--pine);
  color: var(--paper);
}

.routes-loading-inner {
  display: flex;
  align-items: stretch;
}

.routes-loading-status {
  display: grid;
  align-content: center;
  min-height: 64px;
  margin: 0;
  padding: 10px 20px;
  border-left: 1px solid rgb(242 239 234 / 0.18);
  border-right: 1px solid rgb(242 239 234 / 0.18);
}

.routes-loading-label {
  color: var(--sage);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.routes-loading-value {
  color: var(--white);
  font-size: 15px;
  font-weight: 700;
}

/* The loading bar: a sand runner crossing a dark pine track, like the scroll progress on detail */
.routes-loading-track {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 5px;
  overflow: hidden;
  background: #0f3326;
}

.routes-loading-runner {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 32%;
  background: var(--sand);
  animation: routes-loading-run 1.6s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}

@keyframes routes-loading-run {
  from {
    transform: translateX(-100%);
  }

  to {
    transform: translateX(320%);
  }
}

/* Empty tiles in the same grid as the results */
.routes-loading-tiles {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 56px 28px;
  padding-top: 86px;
  padding-bottom: 120px;
}

.routes-loading-tile {
  display: grid;
  align-content: start;
}

.routes-loading-field {
  position: relative;
  display: block;
  aspect-ratio: 1;
  background: var(--night);
}

.routes-loading-line {
  position: absolute;
  inset: 12% 8%;
}

/* Each trail draws itself in, holds, then fades, one tile after another */
.routes-loading-line :deep(path) {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: routes-loading-trace 2.8s var(--ease) var(--tile-delay) infinite;
}

@keyframes routes-loading-trace {
  0% {
    stroke-dashoffset: 1;
    opacity: 1;
  }

  55% {
    stroke-dashoffset: 0;
    opacity: 1;
  }

  80% {
    stroke-dashoffset: 0;
    opacity: 1;
  }

  100% {
    stroke-dashoffset: 0;
    opacity: 0;
  }
}

.routes-loading-chip {
  position: absolute;
  left: 12px;
  bottom: 12px;
  width: 64px;
  height: 26px;
  background: rgb(251 250 247 / 0.1);
}

.routes-loading-name {
  width: 72%;
  height: 14px;
  margin-top: 18px;
  background: var(--granite-200);
}

.routes-loading-facts {
  width: 48%;
  height: 10px;
  margin-top: 12px;
  background: var(--granite-100);
}

@media (prefers-reduced-motion: reduce) {
  .routes-loading-runner {
    width: 100%;
    opacity: 0.35;
    animation: none;
  }

  .routes-loading-line :deep(path) {
    stroke-dashoffset: 0;
    animation: none;
  }
}

@media (max-width: 1100px) {
  .routes-loading-tiles {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .routes-loading-tiles {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 40px 16px;
  }
}
</style>
