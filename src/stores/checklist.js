import { defineStore } from 'pinia'
import * as checklistService from '@/services/checklist.service'

export const useChecklistStore = defineStore('checklist', {
  state: () => ({
    checklist: null,
    items: [],
    allChecklists: [],
    loading: false,
    error: null,
  }),

  actions: {
    async load(routeId, userId) {
      this.checklist = null
      this.items = []
      if (!userId) return

      const { data } = await checklistService.getChecklist(routeId, userId)

      if (data) {
        this.checklist = data
        this.items = (data.checklist_items || []).sort((a, b) => a.sort_order - b.sort_order)
      }
    },

    // all the saved checklists for profile page
    async loadAll(userId) {
      this.error = null
      if (!userId) return

      const { data, error } = await checklistService.listSavedChecklists(userId)

      if (error) {
        this.error = error.message
        return
      }

      this.allChecklists = (data || []).map((c) => ({
        id: c.id,
        routeId: c.route_id,
        routeName: c.routes?.name ?? 'Unknown route',
        country: c.routes?.country ?? '',
        generatedAt: c.generated_at,
        total: c.checklist_items.length,
        packed: c.checklist_items.filter((i) => i.is_checked).length,
      }))
    },

    // delete a whole checklist from the profile page
    async deleteChecklist(checklistId) {
      const { error } = await checklistService.deleteChecklist(checklistId)
      if (error) {
        this.error = error.message
        return
      }
      this.allChecklists = this.allChecklists.filter((c) => c.id !== checklistId)
      if (this.checklist?.id === checklistId) {
        this.checklist = null
        this.items = []
      }
    },

    // bookmark / un-bookmark the checklist currently being viewed
    async toggleSaved() {
      if (!this.checklist) return
      this.error = null

      const { data, error } = await checklistService.setChecklistSaved(
        this.checklist.id,
        !this.checklist.is_saved,
      )

      if (error) {
        this.error = error.message
        return
      }
      this.checklist.is_saved = data.is_saved
    },

    async generate(route, weather, profile) {
      if (this.checklist?.is_saved) {
        this.error = 'Unsave this checklist before regenerating it.'
        return
      }

      this.loading = true
      this.error = null

      const { data: checklist, error } = await checklistService.upsertChecklist(profile.id, route.id)

      if (error) {
        this.error = error.message
        this.loading = false
        return
      }

      await checklistService.deleteAllItems(checklist.id)

      const rows = checklistService.generateChecklistItems(route, weather, profile).map((item) => ({
        ...item,
        checklist_id: checklist.id,
      }))

      const { error: itemsError } = await checklistService.insertItems(rows)
      if (itemsError) this.error = itemsError.message

      await this.load(route.id, profile.id)
      this.loading = false
    },

    async updateItem(itemId, updates) {
      this.error = null
      if (!this.checklist?.is_saved) {
        this.error = 'Save this checklist before editing it.'
        return false
      }
      if (!updates.label?.trim()) {
        this.error = 'Item name cannot be blank.'
        return false
      }

      const { data, error } = await checklistService.updateItem(itemId, {
        label: updates.label,
        quantity: updates.quantity || null,
        reason: updates.reason || null,
        category: updates.category || 'other',
      })

      if (error) {
        this.error = error.message
        return false
      }

      // update if exists
      const index = this.items.findIndex((item) => item.id === itemId)
      if (index !== -1) {
        this.items[index] = data
      }
      return true
    },

    async toggle(item) {
      const { error } = await checklistService.setItemChecked(item.id, !item.is_checked)
      if (!error) item.is_checked = !item.is_checked
    },

    async addCustom(item) {
      this.error = null
      if (!this.checklist?.is_saved) {
        this.error = 'Save this checklist before editing it.'
        return false
      }
      if (!item.label?.trim()) {
        this.error = 'Item name cannot be blank.'
        return false
      }

      const { data, error } = await checklistService.insertItem({
        checklist_id: this.checklist.id,
        label: item.label,
        quantity: item.quantity || null,
        reason: item.reason || null,
        category: item.category || 'other',
        is_custom: true,
        is_checked: false,
        sort_order: this.items.length,
      })

      if (error) {
        this.error = error.message
        return false
      }
      this.items.push(data)
      return true
    },

    async removeItem(itemId) {
      if (!this.checklist?.is_saved) {
        this.error = 'Save this checklist before editing it.'
        return false
      }
      const { error } = await checklistService.deleteItem(itemId)
      if (error) {
        this.error = error.message
        return false
      }
      this.items = this.items.filter((i) => i.id !== itemId)
      return true
    },
  },
})
