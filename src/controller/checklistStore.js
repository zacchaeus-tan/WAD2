import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as checklistModel from '@/model/checklistModel'
import * as routesModel from '@/model/routesModel'
import { checkItemName, tidyItemName, maxNameLength, maxReasonLength } from '@/lib/checklistRules'

const categories = ['clothing', 'safety', 'navigation', 'water_food', 'shelter', 'documents', 'other']

// the model returns { data, error }: throw the error, otherwise give back data
function unwrap(result) {
    if (result.error) {
        throw result.error
    }
    return result.data
}

// the signed-in user, or null (no session counts as "not signed in", not error)
async function currentUser() {
    const { data } = await checklistModel.getUser()
    return data?.user ?? null
}

export const useChecklistStore = defineStore('checklist', () => {
    const checklist = ref(null) // current checklist row, or null
    const items = ref([])
    const error = ref(null)
    const loading = ref(false)
    const savedChecklists = ref([]) // every saved checklist, for the profile page
    const savedLoading = ref(false)

    const checklistId = computed(() =>   
        checklist.value ? checklist.value.id : null
    )

    function clearError() {
        error.value = null
    }

    function reset() {
        checklist.value = null
        items.value = []
        savedChecklists.value = []

        clearError()
    }

    function validate(form) {
        if (checkItemName(form.label)) {
            error.value = checkItemName(form.label)
            return false
        }
        if (form.quantity == null || form.quantity.trim() === ''){
            error.value = 'Quantity is required.'
            return false
        }
        if (form.reason && form.reason.trim().length > maxReasonLength) {
            error.value = 'Reason must be ' + maxReasonLength + ' characters or fewer.'
            return false
        }
        return true
    }

    function clean(form) {
        return {
            label: tidyItemName(form.label),
            category: form.category || 'other',
            quantity: form.quantity?.toString().trim() || null,
            reason: form.reason?.trim() || null,
        }
    }

    // LLM (via the generate-checklist Edge Function) 
    async function fetchItemsFromLLM(route) {
        const { data, error: err } = await checklistModel.invokeGenerateChecklist(route.id)
        if (err || !Array.isArray(data?.items)) {
            console.error('generate-checklist failed:', err, data)
            throw new Error('Could not generate a checklist right now. Please try again.')
        }

        return data.items
            //remove invalid checklist items
            .filter((i) => typeof i?.label === 'string' && i.label.trim())
            // clean each item
            .map((i) => ({
                label: tidyItemName(i.label).slice(0, maxNameLength).trim(),
                category: categories.includes(i.category) ? i.category : 'other',
                quantity: i.quantity ? String(i.quantity).slice(0, 30) : '1',
                reason: i.reason ? String(i.reason).trim().slice(0, maxReasonLength) : null,
                is_checked: false,
                is_custom: false,
            }))
            // drop anything whose name isn't valid
            .filter((i) => checkItemName(i.label) === null)
    }

    async function generate(route) {
        if (checklist.value?.is_saved) {
            error.value = 'Unsave this checklist before generating a new one.'
            return false
        }
        loading.value = true
        clearError()

        try {
            const user = await currentUser()
            if (!user) {
                throw new Error('Please sign in to generate a checklist.')
            }

            // 1. call the LLM first so a failure never deletes the existing checklist
            const generated = await fetchItemsFromLLM(route)
            if (!generated.length) {
                throw new Error('No items were generated. Please try again.')
            }

            // 2. replace the old checklist
            // throw error if delete fails
            unwrap(await checklistModel.deleteChecklistsForRoute(user.id, route.id))

            const created = unwrap(await checklistModel.insertChecklist(user.id, route.id))
            const createdItems = unwrap(await checklistModel.insertItems(created.id, generated))

            checklist.value = created
            items.value = createdItems
            return true
        } catch (e) {
            error.value = e.message
            return false
        }finally {
            loading.value = false
        }
    }

    // loading
    async function loadForRoute(routeId) {
        loading.value = true
        clearError()

        try{
            const user = await currentUser()
            if (!user) {
                reset()
                loading.value = false
                return false
            }

            const data = unwrap(await checklistModel.getSavedChecklistForRoute(user.id, routeId))
            if (!data) {
                reset()
                return true
            }

            checklist.value = data
            items.value = unwrap(await checklistModel.listItemsForChecklist(data.id))
            return true
        } catch (e) {
            error.value = e.message
            return false
        } finally {
            loading.value = false
        }
    }

    // all saved checklists for the signed-in user, with route names and items
    async function loadSaved() {
        savedLoading.value = true
        clearError()

        try {
            const user = await currentUser()
            if (!user) {
                savedChecklists.value = []
                return false
            }

        // saved checklists
            const lists = unwrap(await checklistModel.listSavedChecklists(user.id))
            if (lists.length === 0) {
                savedChecklists.value = []
                return true
            }

        const listIds = lists.map((l) => l.id)
        const routeIds = lists.map((l) => l.route_id)
        // the items
        const rows = unwrap(await checklistModel.listItemsForChecklists(listIds))
        // the routes
        const routes = unwrap(await routesModel.listRoutesByIds(routeIds))

        // put it together: one entry per saved checklist
        const result = []
        for (const l of lists) {
            const route = routes.find((r) => String(r.id) === String(l.route_id))
            result.push({
                id: l.id,
                route_id: l.route_id,
                route_name: route ? route.name : 'Unknown route',
                country: route ? route.country : null,
                items: rows.filter((i) => i.checklist_id === l.id)
            })
        }
        savedChecklists.value = result
        return true
        } catch (e) {
            error.value = e.message
            return false
        } finally {
            savedLoading.value = false
        }
    }
    

    async function toggleSaved() {
        if (!checklist.value){
            return false
        }
        clearError()

        try{
        const next = !checklist.value.is_saved
        // throw error if update fails
        unwrap(await checklistModel.updateChecklistSaved(checklist.value.id, next))
        checklist.value.is_saved = next
        return true
        } catch (e) {
            error.value = e.message
            return false
        }
    }

    // custom item CRUD
    async function addCustom(form, targetId) {
        clearError()
        if (!validate(form)){
            return false
        }
        const id = targetId || checklistId.value
        if (!id) {
            error.value = 'Save the checklist first before adding items.'
            return false
        }

        try {
            const data = unwrap(await checklistModel.insertCustomItem(id, clean(form)))
            // only update the route page's list if the item went into that checklist
            if (id === checklistId.value) {
                items.value.push(data)
            }
            return true
        } catch (e) {
            error.value = e.message
            return false
        }
    }

    async function updateItem(id, form) {
        clearError()
        if (!validate(form)){
            return false
        }

        try {
            const data = unwrap(await checklistModel.updateItem(id, clean(form)))
            const i = items.value.findIndex((x) => x.id === id)
            if (i !== -1) {
                items.value[i] = data
            }
            return true
        } catch (e) {
            error.value = e.message
            return false
        }
    }

    async function deleteItem(id) {
        clearError()

        try {
            unwrap(await checklistModel.deleteItem(id))
            items.value = items.value.filter((x) => x.id !== id)
            return true
        } catch (e) {
            error.value = e.message
            return false
        }
    }

    async function toggleChecked(id, checked) {
        clearError()

        try {
            unwrap(await checklistModel.updateItemChecked(id, checked))
            const item = items.value.find((x) => x.id === id)
            if (item) {
                item.is_checked = checked
            }
            return true
        } catch (e) {
            error.value = e.message
            return false
        }
    }

    return {
        checklist,
        checklistId,
        items,
        error,
        loading,
        savedChecklists,
        savedLoading,
        clearError,
        reset,
        loadForRoute,
        loadSaved,
        generate,
        toggleSaved,
        addCustom,
        updateItem,
        deleteItem,
        toggleChecked
    }
})