<script setup>
import NumberTicker from '@/components/common/NumberTicker.vue'

// The four big figures under the banner. Missing values show a dash.
defineProps({
  route: { type: Object, required: true },
})

function toNumber(value) {
  if (value == null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

// Keep the decimals the data has (10.01 stays 10.01, 9.3 stays 9.3), up to two
function decimalsFor(value) {
  return Math.min(String(value).split('.')[1]?.length ?? 0, 2)
}
</script>

<template>
  <section id="overview" class="route-numbers" aria-label="Route facts">
    <div class="cairn-wrap">
      <dl class="route-numbers-list">
        <div>
          <dt>Distance</dt>
          <dd v-if="toNumber(route.distance_km) != null" class="cairn-data">
            <NumberTicker
              :value="toNumber(route.distance_km)"
              :decimals="decimalsFor(toNumber(route.distance_km))"
              suffix=" km"
            />
          </dd>
          <dd v-else class="cairn-data" aria-label="Not listed">—</dd>
        </div>
        <div>
          <dt>Elevation gain</dt>
          <dd v-if="toNumber(route.elevation_gain_m) != null" class="cairn-data">
            <NumberTicker :value="toNumber(route.elevation_gain_m)" prefix="+" suffix=" m" />
          </dd>
          <dd v-else class="cairn-data" aria-label="Not listed">—</dd>
        </div>
        <div>
          <dt>Highest point</dt>
          <dd v-if="toNumber(route.altitude_m) != null" class="cairn-data">
            <NumberTicker :value="toNumber(route.altitude_m)" suffix=" m" />
          </dd>
          <dd v-else class="cairn-data" aria-label="Not listed">—</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd v-if="toNumber(route.duration_days) != null" class="cairn-data">
            {{ route.duration_days }} {{ Number(route.duration_days) === 1 ? 'day' : 'days' }}
          </dd>
          <dd v-else class="cairn-data" aria-label="Not listed">—</dd>
        </div>
      </dl>
    </div>
  </section>
</template>

<style scoped>
.route-numbers {
  scroll-margin-top: 56px;
  padding-top: 18px;
  background: var(--ground);
}

.route-numbers-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin: 0;
}

.route-numbers-list > div {
  display: grid;
  align-content: start;
  gap: 8px;
  padding: clamp(28px, 4vw, 44px) 20px clamp(24px, 3vw, 36px);
  border-right: 1px solid var(--granite-200);
}

.route-numbers-list > div:first-child {
  padding-left: 0;
}

.route-numbers-list > div:last-child {
  border-right: 0;
}

.route-numbers-list dt {
  color: var(--granite-500);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.route-numbers-list dd {
  margin: 0;
  font-size: clamp(32px, 4.6vw, 68px);
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.02em;
  white-space: nowrap;
}

@media (max-width: 1000px) {
  .route-numbers-list {
    grid-template-columns: 1fr 1fr;
  }

  .route-numbers-list > div:nth-child(odd) {
    padding-left: 0;
  }

  .route-numbers-list > div:nth-child(even) {
    border-right: 0;
  }
}

@media (max-width: 480px) {
  .route-numbers-list > div {
    padding-right: 12px;
  }

  .route-numbers-list > div:nth-child(even) {
    padding-left: 12px;
  }

  .route-numbers-list dd {
    font-size: 26px;
  }
}
</style>
