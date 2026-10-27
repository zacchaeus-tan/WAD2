import { invokeGenerateItinerary } from '@/model/itineraryModel'

// Controller: checks input, calls the model, and turns errors into thrown
// errors so views can show them.

export const PACES = ['relaxed', 'moderate', 'fast']

// Longest itinerary allowed for a route: 1.5x its usual duration, never
// below 14 or above 60 days. Keep in sync with maxDaysFor() in
// supabase/functions/generate-itinerary/index.js.
const MIN_MAX_DAYS = 14
const ABSOLUTE_MAX_DAYS = 60

// Itineraries longer than this take noticeably longer to generate.
export const LONG_ITINERARY_DAYS = 14

export function maxDaysFor(route) {
  const usual = Number(route.duration_days)
  if (!usual) {
    return MIN_MAX_DAYS
  }
  return Math.min(ABSOLUTE_MAX_DAYS, Math.max(MIN_MAX_DAYS, Math.ceil(usual * 1.5)))
}

// Today's date as 'YYYY-MM-DD' in the user's own timezone
export function todayString() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export async function generateItinerary(route, form) {
  if (!route || !route.id) {
    throw new Error('A route is required to generate an itinerary.')
  }
  if (!form.startDate || form.startDate < todayString()) {
    throw new Error('Please choose a start date from today onwards.')
  }
  const maxDays = maxDaysFor(route)
  if (!Number.isInteger(form.days) || form.days < 1 || form.days > maxDays) {
    throw new Error(`Number of days must be between 1 and ${maxDays}.`)
  }
  if (!PACES.includes(form.pace)) {
    throw new Error('Please choose a pace.')
  }

  const { data, error } = await invokeGenerateItinerary({
    route_id: route.id,
    start_date: form.startDate,
    days: form.days,
    pace: form.pace,
  })

  if (error) {
    // The edge function sends { error: message }; show that instead of the
    // generic "non-2xx status code" message when we can.
    let message = error.message
    try {
      const body = await error.context.json()
      if (body.error) {
        message = body.error
      }
    } catch {
      // keep the original message
    }
    throw new Error(message)
  }

  return data
}
