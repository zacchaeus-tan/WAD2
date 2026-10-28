<script setup>
// Stand-in for a route's real line until the simplified route lines are added.
// It is the same drawing for every route; only the colour (difficulty) changes.
defineProps({
  color: { type: String, required: true },
  width: { type: Number, default: 3.4 },
})
</script>

<template>
  <svg class="placeholder-line" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <path
      d="M24 214 C 58 200, 70 168, 104 160 S 150 176, 170 146 S 168 96, 204 86 S 262 104, 282 76 S 300 34, 340 30 S 372 22, 378 14"
      pathLength="1"
      fill="none"
      :stroke="color"
      :stroke-width="width"
      stroke-linecap="round"
      stroke-linejoin="round"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</template>

<style scoped>
.placeholder-line {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}
</style>
