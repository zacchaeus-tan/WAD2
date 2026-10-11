<script setup>
import { computed } from 'vue'
import { difficultyLabel } from '@/lib/format'

const props = defineProps({
  route: { type: Object, required: true },
})

const divergence = computed(() => {
  if (!props.route.effective_difficulty) return 0
  return Number(props.route.effective_difficulty) - Number(props.route.official_difficulty)
})
</script>

<template>
  <div class="row g-3 mb-3">
    <div class="col-md-4"><div class="card text-center p-3">
      <small class="text-muted">Route quality</small>
      <strong class="fs-4">{{ route.avg_rating ?? '—' }}</strong>
      <small class="text-muted">{{ route.review_count }} review(s)</small>
    </div></div>
    <div class="col-md-4"><div class="card text-center p-3">
      <small class="text-muted">Completion rate</small>
      <strong class="fs-4">
        {{ route.completion_rate !== null ? Math.round(route.completion_rate * 100) + '%' : '—' }}
      </strong>
    </div></div>
    <div class="col-md-4"><div class="card text-center p-3">
      <small class="text-muted">Felt difficulty</small>
      <strong class="fs-4">{{ route.avg_perceived_difficulty ?? '—' }}</strong>
      <small class="text-muted">official {{ route.official_difficulty }}</small>
    </div></div>
  </div>

  <div v-if="divergence !== 0" class="alert alert-info small">
    Hikers rate this route
    {{ divergence > 0 ? 'harder' : 'easier' }} than its official
    {{ difficultyLabel(route.official_difficulty) }} grade. Effective difficulty is now
    {{ route.effective_difficulty }} ({{ difficultyLabel(route.effective_difficulty) }}), and that is what the
    difficulty match uses.
  </div>
</template>
