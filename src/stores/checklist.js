import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
// import { er } from 'vue-router/dist/index-D7ja2BKs'

// Rules-based generator: route profile + forecast + the user's experience.
// An LLM call would replace this function and keep the same output shape.
function generateItems(route, weather, profile) {
  const items = []
  const days = route.duration_days || 1
  const coldest = weather ? Math.min(...weather.days.map((d) => d.min)) : null
  const wettest = weather ? Math.max(...weather.days.map((d) => d.rain)) : null
  const beginner = ['beginner', 'occasional'].includes(profile?.experience_level)

  const add = (label, quantity, reason, category) =>
    items.push({ label, quantity, reason, category })

  add('Water', days > 1 ? '3 L capacity' : '2 L', 'No reliable source on most of this route', 'water_food')
  add('Trail snacks', `${days * 3} portions`, `${days} day${days > 1 ? 's' : ''} of walking`, 'water_food')
  add('Sun protection', 'Hat, SPF 50', 'Equatorial sun and little shade above the treeline', 'clothing')
  add('First aid kit', '1 personal kit', 'Standard for any trek', 'safety')
  add('Offline map or GPS', '1', 'Phone signal is unreliable on the trail', 'navigation')

  if (wettest !== null && wettest > 1) {
    add('Rain shell', '1', `Forecast shows ${wettest.toFixed(1)} mm of rain`, 'clothing')
  }
  if (coldest !== null && coldest < 12) {
    add('Insulated jacket', '1', `Forecast low of ${coldest} °C`, 'clothing')
  }
  if (Number(route.altitude_m) > 2500) {
    add('Gloves and warm hat', '1 set', `Summit at ${route.altitude_m} m is far colder than the trailhead`, 'clothing')
  }
  if (days > 1) {
    add('Headtorch', '1 + spare batteries', 'Pre-dawn starts on multi-day routes', 'safety')
    add('Sleeping bag', '1 (3-season)', 'Overnight camp on the mountain', 'shelter')
    add('Power bank', '10,000 mAh', `${days} days without charging`, 'safety')
  }
  if (Number(route.effective_difficulty) >= 3) {
    add('Trekking poles', '1 pair', 'Steep descents on loose ground', 'safety')
  }
  if (route.permit_required) {
    add('Permit documents', '1 copy', 'Permit required for this route', 'documents')
  }
  if (route.guide_required) {
    add('Guide booking confirmation', '1 copy', 'Guide is mandatory on this route', 'documents')
  }
  if (route.community_hazard_level !== 'low') {
    add('Compass and paper backup', '1', `Community hazard level is ${route.community_hazard_level}`, 'navigation')
  }
  if (beginner) {
    add('Blister plasters', '1 pack', 'Common on a first long trek', 'safety')
  }

  return items.map((item, index) => ({ ...item, sort_order: index }))
}


export const useChecklistStore = defineStore('checklist', {
  state: () => ({
    checklist: null,
    items: [],
    allChecklists:[],
    loading: false,
    error: null,
  }),

  actions: {
    async load(routeId, userId) {
      this.checklist = null
      this.items = []
      if (!userId) return

      const { data } = await supabase
        .from('checklists')
        .select('*, checklist_items(*)')
        .eq('route_id', routeId)
        .eq('user_id', userId)
        .maybeSingle()

      if (data) {
        this.checklist = data
        this.items = (data.checklist_items || []).sort((a, b) => a.sort_order - b.sort_order)
      }
    },

    // all the saved checklists for profile page
    async loadAll(userId) {
      this.error = null
      if (!userId) return

      const { data, error } = await supabase
        .from('checklists')
        .select('id, route_id, generated_at, routes(name, country), checklist_items(id, is_checked)')
        .eq('user_id', userId)
        .eq('is_saved',true)
        .order('generated_at', { ascending: false })

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
      const { error } = await supabase.from('checklists').delete().eq('id', checklistId)
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

      const next = !this.checklist.is_saved
      const { data, error } = await supabase
        .from('checklists')
        .update({ is_saved: next })
        .eq('id', this.checklist.id)
        .select('id, is_saved')
        .single()

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

      const { data: checklist, error } = await supabase
        .from('checklists')
        .upsert(
          { user_id: profile.id, route_id: route.id, source: 'fallback', generated_at: new Date().toISOString() },
          { onConflict: 'user_id,route_id' },
        )
        .select()
        .single()

      if (error) {
        this.error = error.message
        this.loading = false
        return
      }

      await supabase.from('checklist_items').delete().eq('checklist_id', checklist.id)

      const rows = generateItems(route, weather, profile).map((item) => ({
        ...item,
        checklist_id: checklist.id,
      }))

      const { error: itemsError } = await supabase.from('checklist_items').insert(rows)
      if (itemsError) this.error = itemsError.message

      await this.load(route.id, profile.id)
      this.loading = false
    },


    async updateItem(itemId,updates){
      this.error =null
      if (!this.checklist?.is_saved) {
        this.error = 'Save this checklist before editing it.'
        return false
      }
      if (!updates.label?.trim()) {
        this.error = 'Item name cannot be blank.'
        return false
      }

      const {data,error} = await supabase.from('checklist_items')
        .update({
          label:updates.label,
          quantity:updates.quantity||null,
          reason:updates.reason||null,
          category:updates.category||'other'
        })
        .eq('id', itemId)
        .select().single()

      if (error){
        this.error = error.message
        return false
      }

      // update if exists
      const index = this.items.findIndex((item)=> item.id === itemId)
      if (index !== -1){
        this.items[index] = data
      }
      return true
    },


    async toggle(item) {
      const { error } = await supabase
        .from('checklist_items')
        .update({ is_checked: !item.is_checked })
        .eq('id', item.id)
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

      const { data, error } = await supabase
        .from('checklist_items')
        .insert({
          checklist_id: this.checklist.id,
          label:item.label,
          quantity:item.quantity||null,
          reason:item.reason||null,
          category:item.category||'other',
          is_custom: true,
          is_checked:false,
          sort_order: this.items.length,
        })
        .select()
        .single()

      if (error){
        this.error = error.message
        return false
      }else{
        this.items.push(data)
        return true
      }
    },

    async removeItem(itemId) {
      if (!this.checklist?.is_saved) {
        this.error = 'Save this checklist before editing it.'
        return false
      }
      const { error } = await supabase.from('checklist_items').delete().eq('id', itemId)
      if (error){
        this.error = error.message
        return false
      }
      this.items = this.items.filter((i) => i.id !== itemId)
      return true
    },
  },
})

