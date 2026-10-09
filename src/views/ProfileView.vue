<script setup>
import { ref, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useChecklistStore } from '@/stores/checklist'
import { formatDate } from '@/lib/format'
import ChecklistForm from '@/components/ChecklistForm.vue'

const auth = useAuthStore()
const checklistStore = useChecklistStore()

onMounted(() => {
  if (auth.user) checklistStore.loadAll(auth.user.id)
})
watch(() => auth.user, (user) => {
  if (user) checklistStore.loadAll(user.id)
})

const openId = ref(null)       // which checklist is expanded
const loadingId = ref(null)    // which one is still loading its items
const showForm = ref(false)    // is the add/edit form visible
const editingItem = ref(null)  // null = add mode, item = edit mode

const categoryLabels = {
  clothing: 'Clothing',
  safety: 'Safety',
  navigation: 'Navigation',
  water_food: 'Water & Food',
  shelter: 'Shelter',
  documents: 'Documents',
  other: 'Other',
}

function openForm(item = null) {
  editingItem.value = item
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingItem.value = null
  checklistStore.error = null
}

// expand/collapse a checklist; expanding loads its items into the shared store
async function toggleOpen(c) {
  closeForm()
  const previouslyOpen = openId.value !== null

  if (openId.value === c.id) {
    openId.value = null
  } else {
    openId.value = c.id
    loadingId.value = c.id
    await checklistStore.load(c.routeId, auth.user.id)
    loadingId.value = null
  }

  // refresh the list so the counts of the checklist we just left are current
  if (previouslyOpen) checklistStore.loadAll(auth.user.id)
}

async function deleteChecklist(c) {
  if (!confirm(`Delete your checklist for ${c.routeName}?`)) return
  await checklistStore.deleteChecklist(c.id)
  if (openId.value === c.id) openId.value = null
}

// the open checklist uses live items so counts update as you tick or edit
const totalCount = (c) => (openId.value === c.id ? checklistStore.items.length : c.total)
const packedCount = (c) =>
  openId.value === c.id ? checklistStore.items.filter((i) => i.is_checked).length : c.packed
</script>



<template>
    <!-- not logged in -->
    <div v-if="!auth.isLoggedIn" class="alert alert-warning">
        <RouterLink to="/auth">Sign in</RouterLink> to see your profile.
    </div>

    <!-- logged in -->
    <div v-else class="container" style="max-width: 720px">
        <h1 class="h3 mb-3">My profile</h1>
        <section class="mb-4">
            <h2 class="h5">My saved gear checklists</h2>

            <div v-if="checklistStore.error && openId === null" class="alert alert-danger small">
                {{ checklistStore.error }}
            </div>

            <p v-if="!checklistStore.allChecklists.length" class="text-muted small">
            No checklists yet. Generate one on a trail and press Save.
            </p>

            <div v-for="c in checklistStore.allChecklists" :key="c.id" class="card mb-3"><div class="card-body">
                <div class="d-flex justify-content-between align-items-start gap-2">
                    <div>
                    <button type="button" class="btn btn-link p-0 h6 mb-0 text-start"
                            :aria-expanded="openId === c.id" @click="toggleOpen(c)">
                        {{ openId === c.id ? '▾' : '▸' }} {{ c.routeName }}
                    </button>
                    <span v-if="c.country" class="text-muted small"> · {{ c.country }}</span>
                    <div class="small text-muted">
                        {{ totalCount(c) ? `${packedCount(c)}/${totalCount(c)} packed` : 'Empty' }}
                        · updated {{ formatDate(c.generatedAt) }}
                    </div>
                    </div>

                    <div class="d-flex gap-3 small">
                    <RouterLink :to="{ name: 'route-detail', params: { id: c.routeId } }">Trail details</RouterLink>
                    <button type="button" class="btn btn-link text-danger p-0 small" @click="deleteChecklist(c)">
                        delete
                    </button>
                    </div>
                </div>

                <!-- expanded checklist -->
                <div v-if="openId === c.id" class="mt-3">
                    <div v-if="checklistStore.error && !showForm" class="alert alert-danger py-2 small">
                    {{ checklistStore.error }}
                    </div>

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
                        <tr v-if="loadingId === c.id">
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
                            <button type="button" class="btn btn-sm btn-link p-0 me-2" @click="openForm(item)">edit</button>
                            <button type="button" class="btn btn-sm btn-link text-danger p-0"
                                    @click="checklistStore.removeItem(item.id)">remove</button>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                    </div>
                <button v-if="!showForm" type="button" class="btn btn-sm btn-outline-secondary mt-3" @click="openForm()">
                + Add item
                </button>

                <ChecklistForm v-if="showForm" :key="editingItem?.id ?? 'new'"
                                :item="editingItem" @done="closeForm" />
                </div>
            </div></div>
        </section>

    <!-- quiz summary-->
        <div class="card mb-4">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start gap-2">
                    <div>
                        <h2 class="h5 mb-1">{{ auth.profile?.display_name || auth.user.email }}</h2>
                        <p class="small text-muted mb-2">
                            Experience: {{ auth.profile?.experience_level || 'not set' }}
                        </p>
                        <p v-if="auth.profile?.fitness_score != null" class="mb-0">
                            Fitness score: <strong>{{ auth.profile.fitness_score }}</strong> / 100
                        </p>
                    </div>

                    <RouterLink class="btn btn-sm btn-outline-primary" :to="{ name: 'quiz' }">
                    {{ auth.profile?.fitness_score != null ? 'Retake quiz' : 'Take the quiz' }}
                    </RouterLink>
                </div>
            </div>
        </div>
    </div>
</template>