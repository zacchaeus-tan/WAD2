<script setup>
import { ref, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useChecklistStore } from '@/stores/checklist'
import ChecklistForm from '@/components/checklist/ChecklistForm.vue'

const props = defineProps({
  route: { type: Object, required: true },
  weather: { type: Object, default: null },
})

const auth = useAuthStore()
const checklistStore = useChecklistStore()

async function generateChecklist() {
  if (checklistStore.items.length &&
      !confirm('Generating a new checklist will delete the current one and replace it. Continue?'))
  {return}
  await checklistStore.generate(props.route, props.weather, auth.profile)
}

const showForm = ref(false)      // is the add/edit form visible
const editingItem = ref(null)    // null = add mode, an item = edit mode

function openForm(item = null) {
  editingItem.value = item
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingItem.value = null
  checklistStore.error = null
}

const isSaved = computed(() => Boolean(checklistStore.checklist?.is_saved))
watch(isSaved, (saved) => {
  if (!saved) closeForm()
})
</script>

<template>
  <section class="mb-4">
    <h2 class="h5">Gear checklist</h2>
    <div v-if="!auth.isLoggedIn" class="alert alert-secondary">
      <RouterLink to="/auth">Sign in</RouterLink> to make a new checklist.
    </div>
    <div v-else>
      <div class="d-flex flex-wrap gap-2 mb-2">
        <button class="btn btn-sm btn-outline-primary mb-2" :disabled="checklistStore.loading||isSaved||!auth.profile"
        @click="generateChecklist">
          {{ checklistStore.items.length ? 'Regenerate' : 'Generate checklist' }}
        </button>

        <button v-if="checklistStore.checklist"
            class="btn btn-sm"
            :class="isSaved ? 'btn-warning' : 'btn-outline-warning'"
            @click="checklistStore.toggleSaved()">
            {{ isSaved ? '★ Saved' : '☆ Save checklist' }}
          </button>
      </div>

      <p v-if="checklistStore.checklist && !isSaved" class="small text-muted">
        Save this checklist to edit it and find it in your profile.
      </p>
      <p v-if="isSaved" class="small text-muted">
        To generate a new checklist, unsave this one first by clicking "★ Saved".
        Generating a new checklist deletes this one.
      </p>
      <p v-if="isSaved && !checklistStore.items.length" class="small text-muted">
        This checklist is empty. Add items below, or unsave it to generate a new one.
      </p>

      <div v-if="checklistStore.error && !showForm" class="alert alert-danger py-2 small">
        {{ checklistStore.error }}
      </div>

      <!-- existing checklist items -->
      <ul v-if="checklistStore.items.length" class="list-group mb-2">
        <li v-for="item in checklistStore.items" :key="item.id" class="list-group-item d-flex align-items-start gap-2">
          <input class="form-check-input mt-1" type="checkbox" :checked="item.is_checked" @change="checklistStore.toggle(item)" />
          <div class="flex-grow-1">
            <span :class="{ 'text-decoration-line-through text-muted': item.is_checked }">
              {{ item.label }} <span v-if="item.quantity" class="text-muted">— {{ item.quantity }}</span>
            </span>
            <div v-if="item.reason" class="small text-muted">{{ item.reason }}</div>
          </div>
          <div v-if="isSaved">
            <button class="btn btn-sm btn-link text-primary p-0" @click="openForm(item)">edit</button>
            <span> | </span>
            <button class="btn btn-sm btn-link text-danger p-0" @click="checklistStore.removeItem(item.id)">remove</button>
          </div>
        </li>
      </ul>

      <div v-if="checklistStore.checklist && isSaved" class="mt-3">
        <button v-if="!showForm" class="btn btn-sm btn-outline-secondary"
          @click="openForm()">+ Add item</button>
        <ChecklistForm v-else :key="editingItem?.id ?? 'new'" :item="editingItem" @done="closeForm" />
      </div>
    </div>
  </section>
</template>
