import { fetchSurveyResponses } from '@/lib/fetch-survey-responses'
import ConsolidationClient from './consolidation-client'

export const dynamic = 'force-dynamic'

export default async function ConsolidatiePage() {
  const { data, error } = await fetchSurveyResponses()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#092147]">Consolidatie</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Teamoverzicht op basis van ingediende survey-antwoorden
        </p>
      </div>
      <ConsolidationClient rows={data ?? []} fetchError={error?.message} />
    </div>
  )
}
