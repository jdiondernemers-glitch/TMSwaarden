'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import type { SurveyResponseRow } from '@/lib/consolidation-types'
import type { CompanyId } from '@/lib/survey-companies'

export function useSurveyResponses(company: CompanyId = 'tms') {
  const [rows, setRows] = useState<SurveyResponseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('survey_responses')
      .select('id, naam, answers, created_at, mode')
      .eq('company', company)
      .order('created_at', { ascending: false })

    if (err) {
      setError(err.message)
      setRows([])
    } else {
      setRows((data ?? []) as SurveyResponseRow[])
    }
    setLoading(false)
  }, [supabase, company])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { rows, loading, error, refetch }
}
