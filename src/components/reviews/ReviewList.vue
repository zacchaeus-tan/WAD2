<script setup>
import { difficultyLabel, formatDate } from '@/lib/format'

// no need to declare a variable as it is only used in the template
defineProps({
  reviews: { type: Array, required: true },
})
</script>

<template>
  <p v-if="!reviews.length" class="text-muted small">No reviews yet.</p>

  <article v-for="review in reviews" :key="review.id" class="card mb-2">
    <div class="card-body">
      <div class="d-flex justify-content-between">
        <strong>{{ review.profiles?.display_name || 'Hiker' }}</strong>
        <span>{{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}</span>
      </div>
      <p class="small text-muted mb-2">
        {{ formatDate(review.created_at) }} · Felt
        {{ difficultyLabel(review.perceived_difficulty) }} ·
        {{ review.completed ? 'Completed' : 'Did not complete' }}
      </p>
      <p v-if="review.review_text" class="mb-2">{{ review.review_text }}</p>
      <div
        v-for="incident in review.review_incidents"
        :key="incident.id"
        class="alert alert-warning py-1 px-2 small mb-1"
      >
        <strong>{{ incident.category }}</strong> — {{ incident.note }}
      </div>
    </div>
  </article>
</template>
