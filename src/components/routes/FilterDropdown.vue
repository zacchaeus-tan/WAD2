<script setup>
import { onBeforeUnmount, onMounted, ref, useId } from 'vue'

// One filter in the pine bar: a button showing the current value, and a panel below it.
// The parent decides which one is open, so only one panel shows at a time.
const props = defineProps({
  label: { type: String, required: true },
  summary: { type: String, required: true },
  isSet: { type: Boolean, default: false }, // highlights the value when a filter is applied
  open: { type: Boolean, default: false },
  alignRight: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle', 'close'])

const panelId = useId()
const root = ref(null)
const button = ref(null)

function onDocumentClick(event) {
  if (props.open && root.value && !root.value.contains(event.target)) {
    emit('close')
  }
}

function onKeydown(event) {
  if (props.open && event.key === 'Escape') {
    emit('close')
    button.value?.focus()
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="root" class="filter-dropdown" :class="{ 'is-right': alignRight }">
    <button
      ref="button"
      type="button"
      class="filter-dropdown-button"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="panelId"
      @click="emit('toggle')"
    >
      <span class="filter-dropdown-label">{{ label }}</span>
      <span class="filter-dropdown-value" :class="{ 'is-set': isSet }">{{ summary }}</span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
    </button>
    <div v-show="open" :id="panelId" class="filter-dropdown-panel">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.filter-dropdown {
  position: relative;
  border-right: 1px solid rgb(242 239 234 / 0.18);
}

.filter-dropdown.is-right {
  border-right: 0;
  border-left: 1px solid rgb(242 239 234 / 0.18);
}

.filter-dropdown-button {
  display: grid;
  grid-template-columns: auto auto;
  column-gap: 10px;
  align-items: center;
  height: 100%;
  min-height: 64px;
  padding: 10px 20px;
  border: 0;
  background: transparent;
  color: var(--paper);
  font-family: var(--font);
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s var(--ease);
}

.filter-dropdown-button:hover,
.filter-dropdown-button[aria-expanded='true'] {
  background: var(--pine-deep);
}

.filter-dropdown-button:focus-visible {
  outline: 3px solid var(--glacier);
  outline-offset: -3px;
}

.filter-dropdown-label {
  grid-column: 1;
  white-space: nowrap;
  color: var(--sage);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.filter-dropdown-value {
  grid-column: 1;
  max-width: 18ch;
  overflow: hidden;
  color: var(--white);
  font-size: 15px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-dropdown-value.is-set {
  color: var(--sand);
}

.filter-dropdown-button svg {
  grid-column: 2;
  grid-row: 1 / 3;
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: rotate 0.25s var(--ease);
}

.filter-dropdown-button[aria-expanded='true'] svg {
  rotate: 180deg;
}

.filter-dropdown-panel {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 5;
  display: grid;
  gap: 14px;
  min-width: 300px;
  padding: 18px;
  background: var(--white);
  color: var(--ink);
  box-shadow: var(--shadow-panel);
}

.filter-dropdown.is-right .filter-dropdown-panel {
  left: auto;
  right: 0;
  min-width: 240px;
}

@media (max-width: 960px) {
  .filter-dropdown,
  .filter-dropdown.is-right {
    position: static;
    flex: 1 1 33%;
    border: 0;
    border-bottom: 1px solid rgb(242 239 234 / 0.18);
  }

  .filter-dropdown-button {
    width: 100%;
    min-height: 56px;
    padding: 8px 12px;
  }

  .filter-dropdown-panel,
  .filter-dropdown.is-right .filter-dropdown-panel {
    left: var(--gutter);
    right: var(--gutter);
    min-width: 0;
  }
}

@media (max-width: 480px) {
  .filter-dropdown,
  .filter-dropdown.is-right {
    flex-basis: 50%;
  }
}
</style>
