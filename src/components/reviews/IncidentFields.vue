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
  <div class="row g-2 mb-2 align-items-end">
    <div class="col-sm-4">
      <label class="form-label small">
        Incident
        <select
          :value="modelValue.category"
          class="form-select form-select-sm"
          @change="update('category', $event.target.value)"
        >
          <option value="" disabled>Select category</option>
          <option v-for="c in categories" :key="c.category" :value="c.category">{{ c.label }}</option>
        </select>
      </label>
    </div>

    <div class="col-sm-7">
      <input
        :value="modelValue.note"
        class="form-control form-control-sm"
        placeholder="What happened?"
        @input="update('note', $event.target.value)"
      />
    </div>

    <div class="col-sm-1">
      <button type="button" class="btn btn-sm btn-link text-danger p-0" @click="emit('remove')">×</button>
    </div>
  </div>
</template>
