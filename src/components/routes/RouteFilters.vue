<script setup>
defineProps({
  countries: { type: Array, required: true },
  difficulties: { type: Array, required: true },
})

const country = defineModel('country', { type: String, default: 'all' })
const difficulty = defineModel('difficulty', { type: String, default: 'all' })
const multidayOnly = defineModel('multidayOnly', { type: Boolean, default: false })
</script>

<template>
  <div class="row g-3 mb-4 align-items-end">
    <div class="col-12 col-md-4">
      <label for="country-select" class="form-label">Country</label>
      <select id="country-select" v-model="country" class="form-select">
        <option v-for="c in countries" :key="c" :value="c">
          {{ c === 'all' ? 'All countries' : c }}
        </option>
      </select>
    </div>

    <div class="col-12 col-md-4">
      <label for="difficulty-select" class="form-label">Difficulty</label>
      <select id="difficulty-select" v-model="difficulty" class="form-select">
        <option v-for="d in difficulties" :key="d" :value="d">
          {{ d === 'all' ? 'All difficulties' : d }}
        </option>
      </select>
    </div>

    <div class="col-12 col-md-4">
      <div class="form-check">
        <input
          id="multiday-check"
          v-model="multidayOnly"
          class="form-check-input"
          type="checkbox"
        />
        <label class="form-check-label" for="multiday-check">
          Multi-day treks only
        </label>
      </div>
    </div>
  </div>
</template>
