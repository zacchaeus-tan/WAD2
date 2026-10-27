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
    <form class="border rounded p-3 mt-3" data-testid="item-form" @submit.prevent="submit">
        <h3 class="h6">{{ item ? 'Edit item' : 'Add an item' }}</h3>

        <div class="row g-2 mb-2">
            <div class="col-sm-6">
                <label class="form-label small" for="cl-label">Item name</label>
                <input
                    id="cl-label"
                    v-model="form.label"
                    class="form-control form-control-sm"
                    data-testid="item-label-input"
                />
            </div>
            <div class="col-sm-6">
                <label class="form-label small" for="cl-category">Category</label>
                <select
                    id="cl-category"
                    v-model="form.category"
                    class="form-select form-select-sm"
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
            </div>
            <div class="col-sm-6">
                <label class="form-label small" for="cl-qty">Quantity</label>
                <input
                    id="cl-qty"
                    v-model="form.quantity"
                    class="form-control form-control-sm"
                    placeholder="e.g. 2, 3L, 1 pair"
                    data-testid="item-quantity-input"
                />
            </div>
            <div class="col-sm-6">
                <label class="form-label small" for="cl-reason">Reason (optional)</label>
                <input
                    id="cl-reason"
                    v-model="form.reason"
                    class="form-control form-control-sm"
                    data-testid="item-reason-input"
                />
            </div>
        </div>

        <div v-if="checklistStore.error" class="alert alert-danger py-2 small" data-testid="item-form-error">
            {{ checklistStore.error }}
        </div>

        <div class="d-flex gap-2">
            <button
                class="btn btn-sm btn-secondary"
                type="submit"
                :disabled="saving"
                data-testid="item-submit-btn"
            >
                {{ item ? 'Save changes' : 'Add' }}
            </button>
            <button
                class="btn btn-sm btn-outline-secondary"
                type="button"
                data-testid="item-cancel-btn"
                @click="emit('done')"
            >
                Cancel
            </button>
        </div>
    </form>
</template>