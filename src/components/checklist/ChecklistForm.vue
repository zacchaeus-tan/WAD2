<script setup>
import { ref } from 'vue'
import { useChecklistStore } from '@/controller/checklistStore'

const props = defineProps({
  item: { type: Object, default: null }, // null = add mode
  checklistId: {type:[String, Number], default:null}
})
const emit = defineEmits(['done'])

const checklistStore = useChecklistStore()

const blank = () => ({
    label: '',
    category: 'other',
    quantity: '',
    reason: ''
})

const form = ref(
  props.item
    ? {
        label: props.item.label,
        category: props.item.category || 'other',
        quantity: props.item.quantity || '',
        reason: props.item.reason || '',
      }
    : blank()
)
const saving = ref(false)
checklistStore.clearError()

async function submit() {
    saving.value = true

    let ok = false
    try {
        if (props.item) {
        ok = await checklistStore.updateItem(props.item.id, form.value)
        } else {
        ok = await checklistStore.addCustom(form.value, props.checklistId)
        }
    } finally {
        saving.value = false
    }
    if (ok){
        emit('done')
    }
}
</script>


<template>
    <form class="checklist-form" data-testid="item-form" @submit.prevent="submit">
        <h3 class="checklist-form-title">{{ item ? 'Edit item' : 'Add an item' }}</h3>

        <div class="checklist-form-fields">
            <label class="checklist-form-field" for="cl-label">
                <span>Item name</span>
                <input
                    id="cl-label"
                    v-model="form.label"
                    class="checklist-form-input"
                    data-testid="item-label-input"
                />
            </label>
            <label class="checklist-form-field" for="cl-category">
                <span>Category</span>
                <select
                    id="cl-category"
                    v-model="form.category"
                    class="checklist-form-input"
                    data-testid="item-category-select"
                >
                    <option value="clothing">Clothing</option>
                    <option value="safety">Safety</option>
                    <option value="navigation">Navigation</option>
                    <option value="water_food">Water &amp; Food</option>
                    <option value="shelter">Shelter</option>
                    <option value="documents">Documents</option>
                    <option value="other">Other</option>
                </select>
            </label>
            <label class="checklist-form-field" for="cl-qty">
                <span>Quantity</span>
                <input
                    id="cl-qty"
                    v-model="form.quantity"
                    class="checklist-form-input"
                    placeholder="e.g. 2, 3L, 1 pair"
                    data-testid="item-quantity-input"
                />
            </label>
            <label class="checklist-form-field" for="cl-reason">
                <span>Reason (optional)</span>
                <input
                    id="cl-reason"
                    v-model="form.reason"
                    class="checklist-form-input"
                    data-testid="item-reason-input"
                />
            </label>
        </div>

        <div v-if="checklistStore.error" class="checklist-form-error" role="alert" data-testid="item-form-error">
            {{ checklistStore.error }}
        </div>

        <div class="checklist-form-actions">
            <button
                class="checklist-form-button is-primary"
                type="submit"
                :disabled="saving"
                data-testid="item-submit-btn"
            >
                {{ item ? 'Save changes' : 'Add' }}
            </button>
            <button
                class="checklist-form-button"
                type="button"
                data-testid="item-cancel-btn"
                @click="emit('done')"
            >
                Cancel
            </button>
        </div>
    </form>
</template>

<style scoped>
/* Square fields and buttons in the CAIRN style; self-contained so it looks the same on the profile page */
.checklist-form {
    display: grid;
    gap: 14px;
    margin-top: 16px;
    padding: 18px;
    border: 2px solid #17201c;
    background: #ffffff;
    font-family: 'Lato', 'Noto Sans Thai', system-ui, sans-serif;
}

.checklist-form-title {
    margin: 0;
    font-size: 16px;
    font-weight: 900;
}

.checklist-form-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.checklist-form-field {
    display: grid;
    gap: 6px;
}

.checklist-form-field span {
    color: #3a4540;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
}

.checklist-form-input {
    width: 100%;
    min-height: 40px;
    padding: 0 10px;
    border: 1.5px solid #c9d0cb;
    border-radius: 0;
    background: #ffffff;
    color: #17201c;
    font: 400 15px 'Lato', system-ui, sans-serif;
}

.checklist-form-input:focus {
    outline: none;
    border-color: #17201c;
    box-shadow: 0 0 0 3px rgb(30 95 140 / 0.25);
}

.checklist-form-error {
    padding: 8px 10px;
    background: #fdecea;
    color: #b42318;
    font-size: 14px;
}

.checklist-form-actions {
    display: flex;
    gap: 8px;
}

.checklist-form-button {
    min-height: 40px;
    padding: 0 16px;
    border: 2px solid #17201c;
    border-radius: 0;
    background: transparent;
    color: #17201c;
    font: 700 13px 'Lato', system-ui, sans-serif;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
}

.checklist-form-button.is-primary {
    background: #17201c;
    color: #fbfaf7;
}

.checklist-form-button:hover {
    background: #1f5b43;
    border-color: #1f5b43;
    color: #ffffff;
}

.checklist-form-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.checklist-form-button:focus-visible {
    outline: 3px solid #1e5f8c;
    outline-offset: 2px;
}

@media (max-width: 560px) {
    .checklist-form-fields {
        grid-template-columns: 1fr;
    }
}
</style>
