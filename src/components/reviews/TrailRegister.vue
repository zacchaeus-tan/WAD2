<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useReviewsStore } from '@/controller/reviewsStore'
import NumberTicker from '@/components/common/NumberTicker.vue'
import ReviewForm from './ReviewForm.vue'
import ReviewList from './ReviewList.vue'

// The reviews section: a summary that stays put while the entries stack beside it.
const props = defineProps({
  route: { type: Object, required: true },
  isLoggedIn: { type: Boolean, required: true },
  userId: { type: String, default: null },
  signInTo: { type: Object, required: true },
})

const emit = defineEmits(['saved', 'deleted'])

const reviewsStore = useReviewsStore()
const formOpen = ref(false)

const hasOwnReview = computed(() => Boolean(props.userId && reviewsStore.myReview(props.userId)))

function toNumber(value) {
  if (value == null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function formatPercent(value) {
  const rate = toNumber(value)
  return rate == null ? '—' : `${Math.round(rate * 100)}%`
}

function onSaved() {
  formOpen.value = false
  emit('saved')
}

function onDeleted() {
  formOpen.value = false
  emit('deleted')
}
</script>

<template>
  <article class="register">
    <div class="register-head">
      <h2 class="cairn-headline">Trail register</h2>
      <button
        v-if="isLoggedIn"
        type="button"
        class="cairn-btn is-small"
        :aria-expanded="formOpen ? 'true' : 'false'"
        aria-controls="register-form"
        @click="formOpen = !formOpen"
      >
        {{ formOpen ? 'Close' : hasOwnReview ? 'Edit your review' : 'Write a review' }}
      </button>
      <p v-else class="cairn-fine">
        <RouterLink :to="signInTo">Sign in</RouterLink>
        to leave a review.
      </p>
    </div>

    <div v-if="isLoggedIn && formOpen" id="register-form">
      <ReviewForm :route="route" :user-id="userId" @saved="onSaved" @deleted="onDeleted" />
    </div>

    <div class="register-body">
      <aside class="register-summary" aria-label="Review summary">
        <p class="register-score cairn-data">
          <template v-if="toNumber(route.avg_rating) != null">
            <NumberTicker :value="toNumber(route.avg_rating)" :decimals="1" /><span class="register-score-out"> / 5</span>
          </template>
          <span v-else class="register-score-empty">No ratings yet</span>
        </p>

        <!-- Placeholder: the star breakdown needs counts stored on the route (a later task) -->
        <div class="register-stars" aria-hidden="true">
          <div v-for="stars in [5, 4, 3, 2, 1]" :key="stars" class="register-stars-row cairn-data">
            <span>{{ stars }}</span>
            <span class="register-stars-bar"></span>
            <span>—</span>
          </div>
        </div>
        <p class="register-placeholder-note">Star breakdown coming soon.</p>

        <dl class="register-facts">
          <div>
            <dt class="cairn-label">Felt like</dt>
            <dd class="cairn-data">
              {{ toNumber(route.avg_perceived_difficulty) == null ? '—' : `${toNumber(route.avg_perceived_difficulty)} / 4` }}
            </dd>
          </div>
          <div>
            <dt class="cairn-label">Completed</dt>
            <dd class="cairn-data">{{ formatPercent(route.completion_rate) }}</dd>
          </div>
          <div>
            <dt class="cairn-label">Reviews</dt>
            <dd class="cairn-data">{{ route.review_count ?? 0 }}</dd>
          </div>
        </dl>
      </aside>

      <div>
        <p v-if="reviewsStore.loadError" role="alert">Unable to load reviews: {{ reviewsStore.loadError }}</p>
        <template v-else>
          <ReviewList :reviews="reviewsStore.reviews" />
          <div v-if="reviewsStore.hasMore" class="register-more">
            <button
              type="button"
              class="cairn-btn is-ghost is-small"
              :disabled="reviewsStore.loadingMore"
              @click="reviewsStore.loadMore(route.id)"
            >
              {{ reviewsStore.loadingMore ? 'Loading...' : 'Show more' }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </article>
</template>

<style scoped>
.register {
  display: grid;
  gap: 28px;
}

.register-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.register-body {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  align-items: start;
  gap: 36px;
}

.register-summary {
  position: sticky;
  top: 80px;
  display: grid;
  gap: 18px;
}

.register-score {
  font-size: 84px;
  font-weight: 600;
  line-height: 0.85;
  letter-spacing: -0.04em;
}

.register-score-out {
  color: var(--granite-500);
  font-size: 0.32em;
  letter-spacing: 0;
}

.register-score .register-score-empty {
  color: var(--granite-700);
  font: 900 22px var(--font);
}

.register-stars {
  display: grid;
  gap: 6px;
}

.register-stars-row {
  display: grid;
  grid-template-columns: 22px 1fr 24px;
  align-items: center;
  gap: 8px;
  color: var(--granite-700);
  font-size: 13px;
  font-weight: 600;
}

.register-stars-bar {
  height: 8px;
  background: var(--granite-200);
}

.register-placeholder-note {
  margin-top: -8px !important;
  color: var(--granite-700);
  font-size: 13px;
}

.register-facts {
  display: grid;
  grid-template-columns: repeat(3, auto);
  justify-content: start;
  gap: 12px 24px;
  margin: 0;
  padding-top: 14px;
  border-top: 1px solid var(--granite-200);
}

.register-facts dd {
  margin: 4px 0 0;
  font-size: 22px;
  font-weight: 600;
  line-height: 1.1;
}

.register-more {
  display: flex;
  justify-content: center;
  margin-top: 28px;
}

@media (max-width: 900px) {
  .register-body {
    grid-template-columns: 1fr;
  }

  .register-summary {
    position: static;
  }
}
</style>
