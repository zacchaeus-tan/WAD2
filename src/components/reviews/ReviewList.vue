<script setup>
import { AnimatePresence, motion } from 'motion-v'
import { difficultyLabel, formatDate } from '@/lib/format'

// no need to declare a variable as it is only used in the template
defineProps({
  reviews: { type: Array, required: true },
})

const STAR = 'm12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z'
</script>

<template>
  <p v-if="!reviews.length" class="review-list-empty">No reviews yet.</p>

  <AnimatePresence v-else as="div" class="review-list">
    <motion.article
      v-for="(review, index) in reviews"
      :key="review.id"
      class="review-entry"
      :initial="{ opacity: 0, y: 12 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.45, delay: (index % 5) * 0.06, ease: [0.16, 1, 0.3, 1] }"
    >
      <span class="review-entry-who" aria-hidden="true">
        {{ (review.profiles?.display_name || 'Hiker').charAt(0).toUpperCase() }}
      </span>
      <div>
        <div class="review-entry-top">
          <strong>
            {{ review.profiles?.display_name || 'Hiker' }}
            <span class="review-entry-stars" role="img" :aria-label="`${review.rating} of 5 stars`">
              <svg v-for="n in 5" :key="n" viewBox="0 0 24 24" :class="{ 'is-off': n > review.rating }" aria-hidden="true">
                <path :d="STAR" />
              </svg>
            </span>
          </strong>
          <time :datetime="review.created_at">{{ formatDate(review.created_at) }}</time>
        </div>

        <p v-if="review.review_text" class="review-entry-text">{{ review.review_text }}</p>

        <div class="review-entry-meta">
          <span class="review-entry-felt">
            Felt {{ difficultyLabel(review.perceived_difficulty) }}
            <span class="review-entry-meter" aria-hidden="true">
              <i v-for="n in 4" :key="n" :class="{ 'is-on': n <= review.perceived_difficulty }"></i>
            </span>
          </span>
          <span :class="review.completed ? 'is-done' : 'is-turned'">
            {{ review.completed ? 'Completed' : 'Did not complete' }}
          </span>
          <span v-for="incident in review.review_incidents" :key="incident.id" class="review-entry-incident">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 2.8 19.5h18.4z" /><path d="M12 10v4.5M12 17.2v.1" /></svg>
            {{ incident.category }} — {{ incident.note }}
          </span>
        </div>
      </div>
    </motion.article>
  </AnimatePresence>
</template>

<style scoped>
.review-list-empty {
  padding: 20px 0;
  border-top: 2px solid var(--ink);
  color: var(--granite-700);
}

.review-list {
  display: grid;
  border-top: 2px solid var(--ink);
}

.review-entry {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 16px;
  padding: 20px 0;
  border-bottom: 1px solid var(--granite-200);
}

.review-entry-who {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  background: var(--pine);
  color: var(--paper);
  font-size: 17px;
  font-weight: 900;
}

.review-entry-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 12px;
}

.review-entry-top strong {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
}

.review-entry-top time {
  color: var(--granite-500);
  font-size: 13px;
}

.review-entry-stars {
  display: inline-flex;
  gap: 2px;
}

.review-entry-stars svg {
  width: 15px;
  height: 15px;
  fill: var(--blaze);
}

.review-entry-stars svg.is-off {
  fill: var(--granite-300);
}

.review-entry-text {
  margin: 8px 0 10px !important;
  font-size: 17px;
  line-height: 26px;
}

.review-entry-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  margin-top: 8px;
  color: var(--granite-700);
  font-size: 13px;
}

.review-entry-felt {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.review-entry-meter {
  display: inline-flex;
  gap: 3px;
}

.review-entry-meter i {
  width: 14px;
  height: 6px;
  background: var(--granite-200);
}

.review-entry-meter i.is-on {
  background: var(--ink);
}

.is-done {
  color: var(--pine);
  font-weight: 700;
}

.is-turned {
  color: var(--warning);
  font-weight: 700;
}

.review-entry-incident {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  background: var(--warning-mist);
  color: #5c3d00;
  font-weight: 700;
}

.review-entry-incident svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}
</style>
