<script setup>
import { useReviewsStore } from '@/stores/reviews'
import { formatDate, difficultyLabel } from '@/lib/format'

const emit = defineEmits(['message'])

const reviewsStore = useReviewsStore()

async function removeReview(review) {
  await reviewsStore.remove(review.id, review.route_id)
  await reviewsStore.fetchAllForModeration()
  emit('message', 'Review deleted.')
}

async function removeIncident(incident) {
  await reviewsStore.removeIncident(incident.id, incident.route_id)
  await reviewsStore.fetchAllForModeration()
  emit('message', 'Incident note deleted.')
}
</script>

<template>
  <h2 class="h5 mt-4">Reviews</h2>
  <p v-if="!reviewsStore.reviews.length" class="text-muted small">No reviews yet.</p>

  <div v-for="review in reviewsStore.reviews" :key="review.id" class="card mb-2"><div class="card-body">
    <div class="d-flex justify-content-between">
      <div>
        <strong>{{ review.profiles?.display_name || 'Hiker' }}</strong>
        <span class="text-muted small"> on {{ review.routes?.name }}</span>
      </div>
      <button class="btn btn-sm btn-outline-danger" @click="removeReview(review)">Delete review</button>
    </div>
    <p class="small text-muted mb-2">
      {{ formatDate(review.created_at) }} · {{ review.rating }}★ ·
      felt {{ difficultyLabel(review.perceived_difficulty) }}
    </p>
    <p class="mb-2">{{ review.review_text }}</p>
    <div v-for="incident in review.review_incidents" :key="incident.id" class="d-flex justify-content-between alert alert-warning py-1 px-2 small mb-1">
      <span><strong>{{ incident.category }}</strong> — {{ incident.note }}</span>
      <button class="btn btn-sm btn-link text-danger p-0" @click="removeIncident(incident)">delete note</button>
    </div>
  </div></div>
</template>
