import { supabase } from '@/lib/supabase'

// Model: calls the generate-itinerary edge function only. Returns Supabase's
// { data, error } unchanged; the controller decides what to do with errors.

export function invokeGenerateItinerary(body) {
  return supabase.functions.invoke('generate-itinerary', { body })
}
