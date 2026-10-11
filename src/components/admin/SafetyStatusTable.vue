<script setup>
import { ref, watch } from 'vue'
import { useRoutesStore } from '@/stores/routes'
import { difficultyLabel } from '@/lib/format'

const emit = defineEmits(['message'])

const routesStore = useRoutesStore()
const statusDraft = ref({})

// Seed an editable draft for each route once the list has loaded.
watch(
  () => routesStore.routes,
  (routes) => {
    routes.forEach((r) => {
      if (!statusDraft.value[r.id]) {
        statusDraft.value[r.id] = { status: r.safety_status, note: r.safety_status_note || '' }
      }
    })
  },
  { immediate: true },
)

async function saveStatus(route) {
  const draft = statusDraft.value[route.id]
  const result = await routesStore.updateSafetyStatus(route.id, draft.status, draft.note)
  emit('message', result.success ? `Updated ${route.name}.` : result.error)
}
</script>

<template>
  <h2 class="h5 mt-4">Route safety status</h2>
  <table class="table table-sm align-middle">
    <thead><tr><th>Route</th><th>Status</th><th>Note</th><th></th></tr></thead>
    <tbody>
      <tr v-for="route in routesStore.routes" :key="route.id">
        <td>
          {{ route.name }}
          <div class="small text-muted">
            {{ difficultyLabel(route.effective_difficulty) }} · hazard {{ route.community_hazard_level }}
          </div>
        </td>
        <td style="width: 140px">
          <select v-if="statusDraft[route.id]" v-model="statusDraft[route.id].status" class="form-select form-select-sm">
            <option value="open">open</option>
            <option value="caution">caution</option>
            <option value="closed">closed</option>
          </select>
        </td>
        <td>
          <input v-if="statusDraft[route.id]" v-model="statusDraft[route.id].note" class="form-control form-control-sm" />
        </td>
        <td><button class="btn btn-sm btn-outline-primary" @click="saveStatus(route)">Save</button></td>
      </tr>
    </tbody>
  </table>
</template>
