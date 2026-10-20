'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import ConsolidationDashboard from '@/app/components/ConsolidationDashboard'
import { mapResponsesToPeople } from '@/lib/map-responses-to-people'
import type { AllocSource, SurveyResponseRow } from '@/lib/consolidation-types'

interface Props {
  rows: SurveyResponseRow[]
  fetchError?: string | null
  eyebrowLabel?: string
}

export default function ConsolidationClient({ rows, fetchError, eyebrowLabel }: Props) {
  const [source, setSource] = useState<AllocSource>('A1')
  const router = useRouter()

  const { people, skipped } = useMemo(
    () => mapResponsesToPeople(rows, source),
    [rows, source]
  )

  const sourceLabel = source === 'A1' ? 'huidige situatie (vandaag)' : 'ambitie over 3 jaar'

  if (fetchError) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto">
        <p className="text-[#092147] font-semibold mb-2">Antwoorden konden niet geladen worden.</p>
        <p className="text-gray-500 text-sm mb-6">Probeer het opnieuw. Blijft het probleem? Neem contact op met de beheerder.</p>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="px-4 py-2 text-sm font-medium bg-[#092147] text-white rounded-xl hover:bg-[#0E2A55] transition-colors"
        >
          Opnieuw proberen
        </button>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <p className="text-gray-500 text-sm">Nog geen antwoorden ingediend.</p>
      </div>
    )
  }

  if (people.length === 0) {
    return (
      <div>
        <SourceToggle source={source} onChange={setSource} />
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center mt-4">
          <p className="text-gray-500 text-sm">
            Geen antwoorden met volledige dimensie-verdeling voor <strong>{sourceLabel}</strong>.
          </p>
          {skipped > 0 && (
            <p className="text-gray-400 text-xs mt-2">
              {skipped} inzending{skipped === 1 ? '' : 'en'} zonder opgeslagen dimensiedata (oudere versie van de survey).
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <SourceToggle source={source} onChange={setSource} />
      {skipped > 0 && (
        <p className="text-xs text-gray-400 mt-3 mb-1">
          {skipped} oudere inzending{skipped === 1 ? '' : 'en'} zonder dimensiedata niet meegenomen.
        </p>
      )}
      <ConsolidationDashboard people={people} eyebrowLabel={eyebrowLabel} />
    </div>
  )
}

function SourceToggle({ source, onChange }: { source: AllocSource; onChange: (s: AllocSource) => void }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-sm text-gray-500 mr-2">Profiel:</span>
      <button
        type="button"
        onClick={() => onChange('A1')}
        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
          source === 'A1'
            ? 'bg-[#092147] text-white'
            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
        }`}
      >
        A1 · Vandaag
      </button>
      <button
        type="button"
        onClick={() => onChange('A2')}
        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
          source === 'A2'
            ? 'bg-[#092147] text-white'
            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
        }`}
      >
        A2 · Ambitie 3 jaar
      </button>
    </div>
  )
}
