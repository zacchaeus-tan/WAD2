import { supabase } from '@/lib/supabase'

// Rules-based generator: route profile + forecast + the user's experience.
// Swapping it for the generate-checklist Edge Function only replaces this
// function, as long as it returns the same item shape:
//
//   const { data, error } = await supabase.functions.invoke('generate-checklist', {
//     body: { routeId: route.id, weather },
//   })
export function generateChecklistItems(route, weather, profile) {
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

export function getChecklist(routeId, userId) {
  return supabase
    .from('checklists')
    .select('*, checklist_items(*)')
    .eq('route_id', routeId)
    .eq('user_id', userId)
    .maybeSingle()
}

export function listSavedChecklists(userId) {
  return supabase
    .from('checklists')
    .select('id, route_id, generated_at, routes(name, country), checklist_items(id, is_checked)')
    .eq('user_id', userId)
    .eq('is_saved', true)
    .order('generated_at', { ascending: false })
}

export function deleteChecklist(checklistId) {
  return supabase.from('checklists').delete().eq('id', checklistId)
}

export function setChecklistSaved(checklistId, isSaved) {
  return supabase
    .from('checklists')
    .update({ is_saved: isSaved })
    .eq('id', checklistId)
    .select('id, is_saved')
    .single()
}

// One checklist per user per route; regenerating reuses the same row.
export function upsertChecklist(userId, routeId) {
  return supabase
    .from('checklists')
    .upsert(
      { user_id: userId, route_id: routeId, source: 'fallback', generated_at: new Date().toISOString() },
      { onConflict: 'user_id,route_id' },
    )
    .select()
    .single()
}

export function deleteAllItems(checklistId) {
  return supabase.from('checklist_items').delete().eq('checklist_id', checklistId)
}

export function insertItems(rows) {
  return supabase.from('checklist_items').insert(rows)
}

export function insertItem(row) {
  return supabase.from('checklist_items').insert(row).select().single()
}

export function updateItem(itemId, fields) {
  return supabase.from('checklist_items').update(fields).eq('id', itemId).select().single()
}

export function setItemChecked(itemId, isChecked) {
  return supabase.from('checklist_items').update({ is_checked: isChecked }).eq('id', itemId)
}

export function deleteItem(itemId) {
  return supabase.from('checklist_items').delete().eq('id', itemId)
}
