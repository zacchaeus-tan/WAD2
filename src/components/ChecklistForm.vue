<script setup>
import { ref, watch } from 'vue'
import { useChecklistStore } from '@/stores/checklist'

const props = defineProps({
  item: { type: Object, default: null }, // null = add mode
})
const emit = defineEmits(['done'])

const checklistStore = useChecklistStore()

const blank = () => ({ label: '', category: 'other', quantity: '', reason: '' })
const form = ref(blank())

watch(
  () => props.item,
  (item) => {
    form.value = item
      ? {
          label: item.label,
          category: item.category || 'other',
          quantity: item.quantity || '',
          reason: item.reason || '',
        }
      : blank()
    checklistStore.error = null
  },
  { immediate: true },
)

async function submit() {
  const ok = props.item
    ? await checklistStore.updateItem(props.item.id, form.value)
    : await checklistStore.addCustom(form.value)
  if (ok) emit('done')
}
</script>

<template>
  <form class="border rounded p-3 mt-3" @submit.prevent="submit">
    <h3 class="h6">{{ item ? 'Edit item' : 'Add an item' }}</h3>

    <div class="row g-2 mb-2">
      <div class="col-sm-6">
        <label class="form-label small" for="cl-label">Item name</label>
        <input id="cl-label" v-model="form.label" class="form-control form-control-sm" />
      </div>
      <div class="col-sm-6">
        <label class="form-label small" for="cl-category">Category</label>
        <select id="cl-category" v-model="form.category" class="form-select form-select-sm">
          <option value="clothing">Clothing</option>
          <option value="safety">Safety</option>
          <option value="navigation">Navigation</option>
          <option value="water_food">Water &amp; Food</option>
          <option value="shelter">Shelter</option>
          <option value="documents">Documents</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div class="col-sm-6">
        <label class="form-label small" for="cl-qty">Quantity</label>
        <input id="cl-qty" v-model="form.quantity" class="form-control form-control-sm"
               placeholder="e.g. 2, 3L, 1 pair" />
      </div>
      <div class="col-sm-6">
        <label class="form-label small" for="cl-reason">Reason (optional)</label>
        <input id="cl-reason" v-model="form.reason" class="form-control form-control-sm" />
      </div>
    </div>

    <div v-if="checklistStore.error" class="alert alert-danger py-2 small">{{ checklistStore.error }}</div>

    <div class="d-flex gap-2">
      <button class="btn btn-sm btn-secondary" type="submit">{{ item ? 'Save changes' : 'Add' }}</button>
      <button class="btn btn-sm btn-outline-secondary" type="button" @click="emit('done')">Cancel</button>
    </div>
  </form>
</template>