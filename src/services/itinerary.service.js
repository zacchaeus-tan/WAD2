import { supabase } from '@/lib/supabase'

export async function generateItinerary(routeId, weather) {
  const { data: { session } } = await supabase.auth.getSession()
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/itinerary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ routeId, weather }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Could not generate an itinerary')
  if (!data?.days?.length) throw new Error('The AI returned an empty itinerary')
  return data
}
