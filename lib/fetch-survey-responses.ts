import { createClient } from '@/lib/supabase-server'
import type { SurveyResponseRow } from '@/lib/consolidation-types'

export async function fetchSurveyResponses(): Promise<{
  data: SurveyResponseRow[] | null
  error: { message: string } | null
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('survey_responses')
    .select('id, naam, answers, created_at, mode')
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: { message: error.message } }
  return { data: (data ?? []) as SurveyResponseRow[], error: null }
}
