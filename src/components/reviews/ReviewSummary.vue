<script setup>
import { computed } from 'vue'
import { difficultyLabel } from '@/lib/format'

const props = defineProps({
  route: { type: Object, required: true },
})

// How far the community's effective difficulty has moved from the official grade.
const divergence = computed(() => {
  if (!props.route.effective_difficulty) return 0
  return Number(props.route.effective_difficulty) - Number(props.route.official_difficulty)
})
</script>

<template>
  <p v-if="divergence !== 0" class="review-summary">
    Hikers rate this route
    {{ divergence > 0 ? 'harder' : 'easier' }} than its official
    {{ difficultyLabel(route.official_difficulty) }} grade. Effective difficulty is now
    {{ route.effective_difficulty }} ({{ difficultyLabel(route.effective_difficulty) }}), and that is what the
    difficulty match uses.
  </p>
</template>

<style scoped>
.review-summary {
  max-width: 52ch;
  color: var(--granite-700);
  font-size: 15px;
  line-height: 23px;
}
</style>
