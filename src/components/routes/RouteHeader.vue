<script setup>
import { difficultyLabel, difficultyClass, hazardClass } from '@/lib/format'

defineProps({
  route: { type: Object, required: true },
})
</script>

<template>
  <h1>{{ route.name }}</h1>
  <p class="text-muted">{{ route.country }}</p>

  <div class="mb-3 d-flex flex-wrap gap-2">
    <span class="badge" :class="difficultyClass(route.effective_difficulty)">
      Effective: {{ difficultyLabel(route.effective_difficulty) }} ({{ route.effective_difficulty }})
    </span>
    <span class="badge bg-secondary">Official: {{ difficultyLabel(route.official_difficulty) }}</span>
    <span class="badge" :class="route.safety_status === 'open' ? 'bg-success' : 'bg-danger'">
      Park status: {{ route.safety_status }}
    </span>
    <span class="badge" :class="hazardClass(route.community_hazard_level)">
      Community hazard: {{ route.community_hazard_level }}
    </span>
  </div>

  <div v-if="route.safety_status !== 'open' && route.safety_status_note" class="alert alert-warning">
    {{ route.safety_status_note }}
  </div>
  <div v-if="route.community_hazard_note" class="alert alert-warning py-2 small">
    {{ route.community_hazard_note }}
  </div>
</template>
