import { supabase } from '@/lib/supabase'

// Model: talks to Supabase for checklists, checklist_items and the
// generate-checklist Edge Function. Each function returns Supabase's
// { data, error } unchanged; the store decides what to do with errors.

export function getUser() {
  return supabase.auth.getUser()
}

// LLM
export function invokeGenerateChecklist(routeId) {
  return supabase.functions.invoke('generate-checklist', { body: { route_id: routeId } })
}

// checklists
export function deleteChecklistsForRoute(userId, routeId) {
  return supabase.from('checklists').delete().eq('user_id', userId).eq('route_id', routeId)
}

export function insertChecklist(userId, routeId) {
  return supabase
    .from('checklists')
    .insert({ user_id: userId, route_id: routeId, is_saved: false })
    .select()
    .single()
}

// the user's saved checklist for one route (data null if there isn't one)
export function getSavedChecklistForRoute(userId, routeId) {
  return supabase
    .from('checklists')
    .select('*')
    .eq('user_id', userId)
    .eq('route_id', routeId)
    .eq('is_saved', true)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
}

export function listSavedChecklists(userId) {
  return supabase
    .from('checklists')
    .select('*')
    .eq('user_id', userId)
    .eq('is_saved', true)
    .order('generated_at', { ascending: false })
}

export function updateChecklistSaved(checklistId, isSaved) {
  return supabase.from('checklists').update({ is_saved: isSaved }).eq('id', checklistId)
}

// checklist items
export function listItemsForChecklist(checklistId) {
  return supabase
    .from('checklist_items')
    .select('*')
    .eq('checklist_id', checklistId)
    .order('category')
}

export function listItemsForChecklists(checklistIds) {
  return supabase
    .from('checklist_items')
    .select('*')
    .in('checklist_id', checklistIds)
    .order('category')
}

export function insertItems(checklistId, items) {
  return supabase
    .from('checklist_items')
    .insert(
      items.map((i) => ({
        checklist_id: checklistId,
        label: i.label,
        category: i.category,
        quantity: i.quantity,
        reason: i.reason,
        is_checked: i.is_checked,
        is_custom: i.is_custom,
      })),
    )
    .select()
}

export function insertCustomItem(checklistId, item) {
  return supabase
    .from('checklist_items')
    .insert({
      checklist_id: checklistId,
      label: item.label,
      category: item.category,
      quantity: item.quantity,
      reason: item.reason,
      is_custom: true,
    })
    .select()
    .single()
}

export function updateItem(itemId, fields) {
  return supabase.from('checklist_items').update(fields).eq('id', itemId).select().single()
}

export function updateItemChecked(itemId, checked) {
  return supabase.from('checklist_items').update({ is_checked: checked }).eq('id', itemId)
}

export function deleteItem(itemId) {
  return supabase.from('checklist_items').delete().eq('id', itemId)
}
