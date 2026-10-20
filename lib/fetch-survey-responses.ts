import { createClient } from '@/lib/supabase-server'
import type { SurveyResponseRow } from '@/lib/consolidation-types'
import type { CompanyId } from '@/lib/survey-companies'

export async function fetchSurveyResponses(company: CompanyId): Promise<{
  data: SurveyResponseRow[] | null
  error: { message: string } | null
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('survey_responses')
    .select('id, naam, answers, created_at, mode')
    .eq('company', company)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: { message: error.message } }
  return { data: (data ?? []) as SurveyResponseRow[], error: null }
}
