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
  <div class="card mb-3">
    <div class="card-body">
      <form @submit.prevent="submitReview">
        <h3 class="h6">{{ myReview ? 'Edit your review' : 'Write a review' }}</h3>

        <div class="row g-2 mb-2">
          <div class="col-sm-4">
            <label class="form-label small" for="rating">Quality (1–5)</label>
            <select id="rating" v-model.number="form.rating" class="form-select form-select-sm">
              <option :value="null" disabled>Select rating</option>
              <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>

          <div class="col-sm-4">
            <label class="form-label small" for="felt">How hard did it feel?</label>
            <select id="felt" v-model.number="form.perceivedDifficulty" class="form-select form-select-sm">
              <option :value="null" disabled>Select difficulty</option>
              <option :value="1">Easy</option>
              <option :value="2">Moderate</option>
              <option :value="3">Hard</option>
              <option :value="4">Strenuous</option>
            </select>
          </div>

          <div class="col-sm-4">
            <label class="form-label small" for="completed">Did you finish?</label>
            <select id="completed" v-model="form.completed" class="form-select form-select-sm">
              <option :value="null" disabled>Select an answer</option>
              <option :value="true">Completed</option>
              <option :value="false">Did not complete</option>
            </select>
          </div>
        </div>

        <textarea
          v-model="form.reviewText"
          class="form-control form-control-sm mb-2"
          rows="3"
          placeholder="How was it?"
        ></textarea>

        <IncidentFields
          v-for="(incident, index) in form.incidents"
          :key="index"
          v-model="form.incidents[index]"
          :categories="reviewsStore.categories"
          @remove="form.incidents.splice(index, 1)"
        />

        <div class="d-flex flex-wrap gap-2">
          <button type="button" class="btn btn-sm btn-outline-secondary" @click="addIncident">
            Flag an incident
          </button>
          <button :disabled="saving" type="submit" class="btn btn-sm btn-success">
            {{ myReview ? 'Update review' : 'Submit review' }}
          </button>
          <button v-if="myReview" type="button" class="btn btn-sm btn-outline-danger" @click="deleteReview">
            Delete
          </button>
        </div>
      </form>

      <div v-if="reviewsStore.error" class="alert alert-danger mt-2 mb-0 small" role="alert">
        {{ reviewsStore.error }}
      </div>
    </div>
  </div>
</template>
