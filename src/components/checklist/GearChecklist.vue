<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { AnimatePresence, motion } from 'motion-v'
import { useChecklistStore } from '@/controller/checklistStore'
import ChecklistForm from './ChecklistForm.vue'

// The gear checklist drawn as a ring-bound notepad. Same behaviour as before:
// generate, save, then edit, remove or add items once saved.
const props = defineProps({
  route: { type: Object, required: true },
  isLoggedIn: { type: Boolean, required: true },
  signInTo: { type: Object, required: true },
})

const checklistStore = useChecklistStore()

async function generateChecklist() {
  if (
    checklistStore.items.length &&
    !confirm('Generating a new checklist will delete the current one and replace it. Continue?')
  ) {
    return
  }
  await checklistStore.generate(props.route)
}

const showForm = ref(false)
const editingItem = ref(null)

function openForm(item = null) {
  editingItem.value = item
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingItem.value = null
  checklistStore.clearError()
}

const isSaved = computed(() => Boolean(checklistStore.checklist?.is_saved))

async function onToggleSaved() {
  await checklistStore.toggleSaved()
  if (!isSaved.value) {
    closeForm() // don't leave a half-open form behind after unsaving
  }
}
</script>

<template>
  <article class="gear">
    <h2 id="gear-title" class="cairn-headline">Gear checklist</h2>

    <p v-if="!isLoggedIn" class="gear-message">
      <RouterLink :to="signInTo">Sign in</RouterLink>
      to make a new checklist.
    </p>

    <div v-else class="gear-grid">
      <div class="gear-pad">
        <div class="gear-binding" aria-hidden="true"><i v-for="hole in 12" :key="hole"></i></div>
        <div class="gear-sheet">
          <div class="gear-sheet-head">
            <strong>{{ route.name }} · pack list</strong>
          </div>

          <p v-if="!checklistStore.items.length" class="gear-empty">
            {{ checklistStore.loading ? 'Writing your list...' : 'No items yet. Generate a checklist to start.' }}
          </p>

          <AnimatePresence as="ul" class="gear-list">
            <motion.li
              v-for="(item, index) in checklistStore.items"
              :key="item.id"
              class="gear-item"
              :initial="{ opacity: 0, y: 12 }"
              :animate="{ opacity: 1, y: 0 }"
              :exit="{ opacity: 0, height: 0 }"
              :transition="{ duration: 0.45, delay: Math.min(index, 12) * 0.06, ease: [0.16, 1, 0.3, 1] }"
            >
              <label class="gear-item-label">
                <input
                  type="checkbox"
                  :checked="item.is_checked"
                  @change="checklistStore.toggleChecked(item.id, !item.is_checked)"
                />
                <span class="gear-item-text" :class="{ 'is-checked': item.is_checked }">
                  {{ item.label }}<span v-if="item.quantity" class="gear-item-quantity"> — {{ item.quantity }}</span>
                </span>
              </label>
              <span v-if="item.reason" class="gear-item-reason">{{ item.reason }}</span>
              <span v-if="isSaved" class="gear-item-tools">
                <button type="button" @click="openForm(item)">Edit</button>
                <button type="button" class="is-remove" @click="checklistStore.deleteItem(item.id)">Remove</button>
              </span>
            </motion.li>
          </AnimatePresence>

          <div v-if="checklistStore.checklist && isSaved" class="gear-form-area">
            <button v-if="!showForm" type="button" class="cairn-link" @click="openForm()">+ Add item</button>
            <ChecklistForm v-else :key="editingItem?.id ?? 'new'" :item="editingItem" @done="closeForm" />
          </div>
        </div>
      </div>

      <aside class="gear-side">
        <div class="gear-note">
          <strong>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
            </svg>
            AI-generated
          </strong>
          Adjust the list to your own experience and the conditions on the day.
        </div>

        <button
          type="button"
          class="cairn-btn is-blaze"
          :disabled="checklistStore.loading || isSaved"
          @click="generateChecklist"
        >
          {{
            checklistStore.loading
              ? 'Generating...'
              : checklistStore.items.length
                ? 'Regenerate'
                : 'Generate checklist'
          }}
        </button>

        <button
          v-if="checklistStore.checklist"
          type="button"
          class="cairn-btn"
          :class="{ 'is-ghost': !isSaved }"
          :aria-pressed="isSaved ? 'true' : 'false'"
          @click="onToggleSaved"
        >
          {{ isSaved ? 'Saved' : 'Save checklist' }}
        </button>

        <p v-if="checklistStore.checklist && !isSaved" class="cairn-fine">
          Save this checklist to edit it and find it in your profile.
        </p>
        <p v-if="isSaved" class="cairn-fine">
          To generate a new checklist, unsave this one first by clicking "Saved". Generating a new checklist
          deletes this one.
        </p>
        <p v-if="isSaved && !checklistStore.items.length" class="cairn-fine">
          This checklist is empty. Add items, or unsave it to generate a new one.
        </p>

        <p v-if="checklistStore.error && !showForm" class="gear-error" role="alert">
          {{ checklistStore.error }}
        </p>
      </aside>
    </div>
  </article>
</template>

<style scoped>
.gear {
  display: grid;
  gap: 24px;
}

.gear-message {
  font-size: 17px;
}

.gear-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  align-items: start;
  gap: 32px;
}

/* A ring-bound sheet with a red margin and blue ruling, tilted slightly */
.gear-pad {
  position: relative;
  min-width: 0;
  filter: drop-shadow(0 16px 24px rgb(23 32 28 / 0.18));
  transform: rotate(-0.6deg);
}

.gear-binding {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 34px;
  padding: 0 24px;
  background: #2b3832;
}

.gear-binding i {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--ground);
  box-shadow: inset 0 2px 3px rgb(0 0 0 / 0.45);
}

.gear-sheet {
  position: relative;
  min-height: 320px;
  padding: 18px 28px 26px 92px;
  background-color: var(--notepad);
  background-image:
    linear-gradient(to right, transparent 70px, #e5a3a3 70px 72px, transparent 72px),
    repeating-linear-gradient(to bottom, transparent 0 47px, #b8d2e6 47px 48px);
  background-position:
    0 0,
    0 52px;
}

.gear-sheet-head {
  display: flex;
  align-items: baseline;
  height: 34px;
  margin-bottom: 18px;
}

.gear-sheet-head strong {
  font-size: 20px;
  font-weight: 900;
}

.gear-empty {
  color: var(--granite-700);
  line-height: 48px;
}

.gear-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.gear-item {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  column-gap: 12px;
  min-height: 48px;
  overflow: hidden;
}

.gear-item-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.gear-item-label input {
  position: relative;
  flex: none;
  width: 20px;
  height: 20px;
  margin: 0;
  border: 2px solid var(--granite-700);
  background: transparent;
  appearance: none;
  cursor: pointer;
}

/* A hand-drawn blaze tick */
.gear-item-label input:checked::after {
  content: '';
  position: absolute;
  left: -2px;
  top: -8px;
  width: 24px;
  height: 24px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23c2481a' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 13l5 5L21 4'/%3E%3C/svg%3E") no-repeat center / contain;
}

.gear-item-label input:focus-visible {
  outline: 3px solid var(--lake);
  outline-offset: 2px;
}

.gear-item-text {
  position: relative;
  font-size: 17px;
}

/* A strike that draws across once the item is ticked */
.gear-item-text::after {
  content: '';
  position: absolute;
  left: -4px;
  right: -4px;
  top: 55%;
  height: 2px;
  background: var(--granite-700);
  transform: scaleX(0);
  transform-origin: 0 50%;
  transition: transform 0.35s var(--ease);
}

.gear-item-text.is-checked {
  color: var(--granite-500);
}

.gear-item-text.is-checked::after {
  transform: scaleX(1);
}

.gear-item-quantity {
  color: var(--granite-700);
}

.gear-item-reason {
  grid-column: 1;
  padding: 0 0 10px 32px;
  color: var(--granite-700);
  font-size: 14px;
  line-height: 20px;
}

.gear-item-tools {
  grid-column: 2;
  grid-row: 1;
  display: flex;
  gap: 4px;
}

.gear-item-tools button {
  min-height: 32px;
  padding: 0 8px;
  border: 0;
  background: transparent;
  color: var(--ink);
  font: 700 13px var(--font);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.gear-item-tools button.is-remove {
  color: #b42318;
}

.gear-form-area {
  margin-top: 12px;
}

.gear-side {
  display: grid;
  gap: 16px;
}

.gear-side .cairn-btn {
  width: 100%;
}

/* Yellow sticky note */
.gear-note {
  display: grid;
  gap: 10px;
  padding: 18px;
  background: #ffe68a;
  box-shadow: 0 10px 18px rgb(23 32 28 / 0.15);
  font-size: 15px;
  line-height: 22px;
  transform: rotate(1.5deg);
}

.gear-note strong {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.gear-note svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
}

.gear-error {
  padding: 10px 12px;
  background: #fdecea;
  color: #b42318;
  font-size: 14px;
}

@media (prefers-reduced-motion: reduce) {
  .gear-item-text::after {
    transition: none;
  }
}

@media (max-width: 900px) {
  .gear-grid {
    grid-template-columns: 1fr;
  }

  .gear-sheet {
    padding-left: 62px;
    background-image:
      linear-gradient(to right, transparent 44px, #e5a3a3 44px 46px, transparent 46px),
      repeating-linear-gradient(to bottom, transparent 0 47px, #b8d2e6 47px 48px);
  }
}
</style>
