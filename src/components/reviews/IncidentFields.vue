<script setup>
const props = defineProps({
  modelValue: { type: Object, required: true },
  categories: { type: Array, required: true },
})

const emit = defineEmits(['update:modelValue', 'remove'])

// Props are read-only, so send the parent a changed copy instead of editing it.
function update(field, value) {
  // '...' grabs every property of the modelValue object. [field]: value sets the property named by the field variable to the new value.
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}
</script>

<template>
  <div class="incident-fields">
    <label class="incident-fields-field">
      <span class="cairn-label">Incident</span>
      <select
        :value="modelValue.category"
        class="cairn-input"
        @change="update('category', $event.target.value)"
      >
        <option value="" disabled>Select category</option>
        <option v-for="c in categories" :key="c.category" :value="c.category">{{ c.label }}</option>
      </select>
    </label>

    <label class="incident-fields-field">
      <span class="cairn-label">What happened?</span>
      <input
        :value="modelValue.note"
        class="cairn-input"
        @input="update('note', $event.target.value)"
      />
    </label>

    <button type="button" class="incident-fields-remove" @click="emit('remove')">Remove</button>
  </div>
</template>

<style scoped>
.incident-fields {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) auto;
  align-items: end;
  gap: 12px;
  padding: 12px;
  background: var(--warning-mist);
}

.incident-fields-field {
  display: grid;
  gap: 6px;
}

.incident-fields-field .cairn-label {
  color: #5c3d00;
}

.incident-fields-remove {
  min-height: 44px;
  padding: 0 8px;
  border: 0;
  background: none;
  color: #b42318;
  font: 700 13px var(--font);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

@media (max-width: 700px) {
  .incident-fields {
    grid-template-columns: 1fr;
  }

  .incident-fields-remove {
    justify-self: start;
  }
}
</style>
