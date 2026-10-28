<script setup>
import { ref, computed, watch } from 'vue'
import { useReviewsStore } from '@/controller/reviewsStore'
import IncidentFields from './IncidentFields.vue'

const props = defineProps({
  route: { type: Object, required: true },
  userId: { type: String, required: true },
})

const emit = defineEmits(['saved', 'deleted'])

const reviewsStore = useReviewsStore()
const saving = ref(false)

// null means "not chosen yet", so the dropdowns start on their placeholder.
const form = ref({
  rating: null,
  perceivedDifficulty: null,
  completed: null,
  reviewText: '',
  incidents: [],
})

const myReview = computed(() => reviewsStore.myReview(props.userId))

function resetForm() {
  if (myReview.value) {
    form.value = {
      rating: myReview.value.rating,
      perceivedDifficulty: myReview.value.perceived_difficulty,
      completed: myReview.value.completed,
      reviewText: myReview.value.review_text || '',
      incidents: (myReview.value.review_incidents || []).map((i) => ({
        category: i.category,
        note: i.note,
        pointId: i.point_id,
      })),
    }
  } else {
    form.value = {
      rating: null,
      perceivedDifficulty: null,
      completed: null,
      reviewText: '',
      incidents: [],
    }
  }
}

watch(myReview, resetForm, { immediate: true })

function addIncident() {
  form.value.incidents.push({ category: '', note: '', pointId: null })
}

async function submitReview() {
  saving.value = true

  const submitted = await reviewsStore.save({
    routeId: props.route.id,
    userId: props.userId,
    rating: form.value.rating,
    perceivedDifficulty: form.value.perceivedDifficulty,
    completed: form.value.completed,
    reviewText: form.value.reviewText,
    incidents: form.value.incidents,
  })

  saving.value = false
  if (submitted) emit('saved')
}

async function deleteReview() {
  const deleted = await reviewsStore.remove(myReview.value.id, props.route.id)
  if (deleted) emit('deleted')
}
</script>

<template>
  <form class="review-form" @submit.prevent="submitReview">
    <h3 class="review-form-title">{{ myReview ? 'Edit your review' : 'Write a review' }}</h3>

    <div class="review-form-row">
      <label class="review-form-field" for="rating">
        <span class="cairn-label">Quality (1–5)</span>
        <select id="rating" v-model.number="form.rating" class="cairn-input">
          <option :value="null" disabled>Select rating</option>
          <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
        </select>
      </label>

      <label class="review-form-field" for="felt">
        <span class="cairn-label">How hard did it feel?</span>
        <select id="felt" v-model.number="form.perceivedDifficulty" class="cairn-input">
          <option :value="null" disabled>Select difficulty</option>
          <option :value="1">Easy</option>
          <option :value="2">Moderate</option>
          <option :value="3">Hard</option>
          <option :value="4">Strenuous</option>
        </select>
      </label>

      <label class="review-form-field" for="completed">
        <span class="cairn-label">Did you finish?</span>
        <select id="completed" v-model="form.completed" class="cairn-input">
          <option :value="null" disabled>Select an answer</option>
          <option :value="true">Completed</option>
          <option :value="false">Did not complete</option>
        </select>
      </label>
    </div>

    <label class="review-form-field" for="review-text">
      <span class="cairn-label">Your review</span>
      <textarea
        id="review-text"
        v-model="form.reviewText"
        class="cairn-input review-form-text"
        rows="3"
        placeholder="How was it?"
      ></textarea>
    </label>

    <IncidentFields
      v-for="(incident, index) in form.incidents"
      :key="index"
      v-model="form.incidents[index]"
      :categories="reviewsStore.categories"
      @remove="form.incidents.splice(index, 1)"
    />

    <div class="review-form-actions">
      <button type="button" class="cairn-btn is-ghost is-small" @click="addIncident">Flag an incident</button>
      <button :disabled="saving" type="submit" class="cairn-btn is-small">
        {{ myReview ? 'Update review' : 'Submit review' }}
      </button>
      <button v-if="myReview" type="button" class="cairn-link review-form-delete" @click="deleteReview">
        Delete
      </button>
    </div>

    <p v-if="reviewsStore.error" class="review-form-error" role="alert">
      {{ reviewsStore.error }}
    </p>
  </form>
</template>

<style scoped>
.review-form {
  display: grid;
  gap: 16px;
  padding: 24px;
  border: 2px solid var(--ink);
  background: var(--white);
}

.review-form-title {
  font-size: 18px;
  font-weight: 900;
}

.review-form-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.review-form-field {
  display: grid;
  gap: 6px;
}

.review-form-field .cairn-label {
  color: var(--granite-700);
}

.review-form-text {
  min-height: 96px;
  padding: 10px 12px;
  resize: vertical;
}

.review-form-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.review-form-delete {
  margin-left: 6px;
  color: #b42318;
}

.review-form-error {
  padding: 10px 12px;
  background: #fdecea;
  color: #b42318;
  font-size: 14px;
}

@media (max-width: 700px) {
  .review-form-row {
    grid-template-columns: 1fr;
  }
}
</style>
