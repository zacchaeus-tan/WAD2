<script setup>
import { computed } from 'vue'

// Two sliders on one track for a minimum and a maximum. Positions run 0-100;
// the parent turns them into real values, so a scale can be uneven (more room for short routes).
const props = defineProps({
  label: { type: String, required: true },
  modelValue: { type: Array, required: true }, // [low, high] positions, 0-100
  valueText: { type: String, required: true }, // e.g. "5-20 km"
  lowText: { type: String, required: true },
  highText: { type: String, required: true },
})

const emit = defineEmits(['update:modelValue'])

const fillStyle = computed(() => ({
  left: `${props.modelValue[0]}%`,
  right: `${100 - props.modelValue[1]}%`,
}))

// The handles may not cross
function setLow(event) {
  const low = Math.min(Number(event.target.value), props.modelValue[1])
  event.target.value = low
  emit('update:modelValue', [low, props.modelValue[1]])
}

function setHigh(event) {
  const high = Math.max(Number(event.target.value), props.modelValue[0])
  event.target.value = high
  emit('update:modelValue', [props.modelValue[0], high])
}
</script>

<template>
  <div class="range-filter">
    <div class="range-filter-head">
      <span class="cairn-label">{{ label }}</span>
      <span class="range-filter-value cairn-data">{{ valueText }}</span>
    </div>
    <div class="range-filter-dual">
      <span class="range-filter-track"><span class="range-filter-fill" :style="fillStyle"></span></span>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        :value="modelValue[0]"
        :aria-label="`Minimum ${label.toLowerCase()}`"
        :aria-valuetext="lowText"
        @input="setLow"
      />
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        :value="modelValue[1]"
        :aria-label="`Maximum ${label.toLowerCase()}`"
        :aria-valuetext="highText"
        @input="setHigh"
      />
    </div>
  </div>
</template>

<style scoped>
.range-filter {
  display: grid;
  gap: 10px;
}

.range-filter-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.range-filter-value {
  font-size: 14px;
  font-weight: 600;
}

.range-filter-dual {
  position: relative;
  height: 28px;
}

.range-filter-track {
  position: absolute;
  left: 0;
  right: 0;
  top: 12px;
  height: 4px;
  background: var(--granite-200);
}

.range-filter-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  background: var(--ink);
}

/* Both sliders sit on the same track; only their handles take clicks */
.range-filter-dual input {
  position: absolute;
  inset: 0;
  width: 100%;
  margin: 0;
  background: none;
  pointer-events: none;
  appearance: none;
}

.range-filter-dual input::-webkit-slider-thumb {
  width: 18px;
  height: 18px;
  border: 2px solid var(--ink);
  border-radius: 0;
  background: var(--white);
  pointer-events: auto;
  cursor: pointer;
  appearance: none;
}

.range-filter-dual input::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border: 2px solid var(--ink);
  border-radius: 0;
  background: var(--white);
  pointer-events: auto;
  cursor: pointer;
}

.range-filter-dual input:focus-visible::-webkit-slider-thumb {
  outline: 3px solid var(--lake);
  outline-offset: 2px;
}

.range-filter-dual input:focus-visible::-moz-range-thumb {
  outline: 3px solid var(--lake);
  outline-offset: 2px;
}
</style>
