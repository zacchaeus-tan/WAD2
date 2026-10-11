<script setup>
import { useChecklistStore } from '@/stores/checklist'

defineProps({
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['edit'])

const checklistStore = useChecklistStore()

const categoryLabels = {
  clothing: 'Clothing',
  safety: 'Safety',
  navigation: 'Navigation',
  water_food: 'Water & Food',
  shelter: 'Shelter',
  documents: 'Documents',
  other: 'Other',
}
</script>

<template>
  <div class="table-responsive">
    <table class="table table-sm align-middle mb-0">
      <thead>
        <tr>
          <th style="width: 2rem"><span class="visually-hidden">Packed</span></th>
          <th>Item</th>
          <th>Quantity</th>
          <th>Category</th>
          <th>Reason</th>
          <th><span class="visually-hidden">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td colspan="6" class="text-center text-muted small">Loading…</td>
        </tr>
        <tr v-else-if="!checklistStore.items.length">
          <td colspan="6" class="text-center text-muted small">No items yet. Add one below.</td>
        </tr>
        <tr v-for="item in checklistStore.items" :key="item.id">
          <td>
            <input class="form-check-input" type="checkbox"
                   :aria-label="`Packed: ${item.label}`"
                   :checked="item.is_checked"
                   @change="checklistStore.toggle(item)" />
          </td>
          <td :class="{ 'text-decoration-line-through text-muted': item.is_checked }">{{ item.label }}</td>
          <td>{{ item.quantity || '—' }}</td>
          <td>{{ categoryLabels[item.category] ?? item.category }}</td>
          <td class="text-muted">{{ item.reason || '—' }}</td>
          <td class="text-nowrap">
            <button type="button" class="btn btn-sm btn-link p-0 me-2" @click="emit('edit', item)">edit</button>
            <button type="button" class="btn btn-sm btn-link text-danger p-0"
                    @click="checklistStore.removeItem(item.id)">remove</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
