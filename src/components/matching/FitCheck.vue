<script setup>
import { RouterLink } from 'vue-router'

// The personal verdict on pine: one row per rule check, with a solid mark so
// pass and fail read at a glance. The checks themselves come from lib/matching.js.
defineProps({
  suitability: { type: Object, default: null }, // checkRouteSuitability() result, or null while loading
  isLoggedIn: { type: Boolean, required: true },
  signInTo: { type: Object, required: true }, // where "Sign in" should go, with the redirect back here
})

const verdictLabels = {
  comfortable: 'Comfortable',
  good_challenge: 'Good challenge',
  stretch: 'A stretch',
  unknown: 'Not enough information yet',
}

const verdictDescriptions = {
  comfortable: 'Within what you have done before.',
  good_challenge: 'A step up in one or two areas.',
  stretch: 'Well beyond what you have done so far.',
}

// How many bars of the meter fill, and in which heat colour
const verdictMeter = {
  comfortable: { bars: 1, color: '#6fdc8c' },
  good_challenge: { bars: 2, color: '#f2d34f' },
  stretch: { bars: 3, color: '#ff9f43' },
  unknown: { bars: 0, color: '' },
}

const ruleLabels = {
  difficulty: 'Difficulty',
  distance: 'Distance',
  elevation_gain: 'Elevation gain',
  altitude: 'Altitude',
  trip_type: 'Trip length',
}

const statusLabels = {
  pass: 'Within your experience',
  fail: 'New for you',
  unknown: 'Unknown',
}
</script>

<template>
  <article class="fit-check">
    <div class="fit-check-top">
      <h2 id="fit-title" class="cairn-headline">Is this route right for you?</h2>
      <p v-if="isLoggedIn && suitability" class="fit-check-verdict">
        <span class="fit-check-meter" aria-hidden="true">
          <i
            v-for="bar in 3"
            :key="bar"
            :style="bar <= verdictMeter[suitability.verdict].bars ? { background: verdictMeter[suitability.verdict].color } : null"
          ></i>
        </span>
        {{ verdictLabels[suitability.verdict] }}
      </p>
    </div>

    <p v-if="!isLoggedIn" class="fit-check-message">
      <RouterLink class="fit-check-link" :to="signInTo">Sign in</RouterLink>
      to compare this route with your hiking experience.
    </p>

    <p v-else-if="!suitability" class="fit-check-message" role="status">Loading your profile...</p>

    <template v-else>
      <p v-if="suitability.verdict === 'unknown'" class="fit-check-message">
        <RouterLink class="fit-check-link" to="/quiz">Update your hiking profile</RouterLink>
        to see how this route compares.
      </p>
      <p v-else class="fit-check-message">{{ verdictDescriptions[suitability.verdict] }}</p>

      <ul class="fit-check-list">
        <template v-for="check in suitability.checks" :key="check.rule">
          <li v-if="check.status !== 'not_applicable'" :class="`is-${check.status}`">
            <span class="fit-check-mark" :class="`is-${check.status}`" role="img" :aria-label="statusLabels[check.status]">
              <svg v-if="check.status === 'pass'" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>
              <svg v-else-if="check.status === 'fail'" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.1" /></svg>
            </span>
            <span><strong>{{ ruleLabels[check.rule] }}</strong> {{ check.message }}</span>
          </li>
        </template>
      </ul>

      <p v-for="warning in suitability.warnings" :key="warning" class="fit-check-warning" role="note">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 2.8 19.5h18.4z" /><path d="M12 10v4.5M12 17.2v.1" /></svg>
        {{ warning }}
      </p>

      <p class="fit-check-note">
        Based on your quiz answers. Only you know your real fitness, so treat this as a guide.
      </p>
    </template>
  </article>
</template>

<style scoped>
.fit-check {
  display: grid;
  gap: 24px;
  padding: clamp(24px, 3vw, 44px);
  background: var(--pine);
  color: var(--paper);
  box-shadow: var(--shadow-stop);
}

.fit-check-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 16px 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid rgb(242 239 234 / 0.9);
}

.fit-check-verdict {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-size: clamp(22px, 2.2vw, 30px);
  font-weight: 900;
}

.fit-check-meter {
  display: inline-grid;
  grid-auto-flow: column;
  gap: 3px;
}

.fit-check-meter i {
  width: 10px;
  height: 32px;
  background: rgb(242 239 234 / 0.25);
}

.fit-check-message {
  font-size: 17px;
  line-height: 26px;
  color: var(--lichen);
}

.fit-check-link {
  color: var(--white) !important;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.fit-check-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.fit-check-list li {
  display: grid;
  grid-template-columns: 32px 1fr;
  align-items: center;
  gap: 16px;
  padding: 20px 0;
  border-bottom: 1px solid rgb(242 239 234 / 0.18);
  font-size: 18px;
  line-height: 26px;
}

.fit-check-list li strong {
  display: inline-block;
  min-width: 200px;
  margin-right: 8px;
  font-weight: 900;
}

/* Solid marks: paper box with a pine tick for pass, blaze box with a white cross for fail */
.fit-check-mark {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
}

.fit-check-mark svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke-width: 3.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.fit-check-mark.is-pass {
  background: var(--paper);
}

.fit-check-mark.is-pass svg {
  stroke: var(--pine);
}

.fit-check-mark.is-fail {
  background: var(--blaze);
  box-shadow: 0 0 0 3px var(--ember);
}

.fit-check-mark.is-fail svg {
  stroke: var(--white);
}

.fit-check-mark.is-unknown {
  border: 2px solid rgb(242 239 234 / 0.6);
}

.fit-check-mark.is-unknown svg {
  stroke: var(--paper);
  stroke-width: 2.4;
}

.fit-check-list li.is-fail {
  color: #ffd2bd;
}

.fit-check-list li.is-fail strong {
  color: var(--white);
}

.fit-check-warning {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: #ffe7a8;
  font-size: 16px;
  line-height: 24px;
}

.fit-check-warning svg {
  width: 20px;
  height: 20px;
  flex: none;
  margin-top: 2px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}

.fit-check-note {
  color: var(--lichen);
  font-size: 14px;
}

@media (max-width: 700px) {
  .fit-check-list li {
    font-size: 16px;
  }

  .fit-check-list li strong {
    display: block;
    min-width: 0;
  }
}
</style>
