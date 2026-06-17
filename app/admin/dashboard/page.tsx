'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

interface Question { q_id: string; q: string; type: string; part: string; opts?: [string,string][]; items?: [string,string][] }
interface Response  { id: string; created_at: string; naam: string | null; mode: string | null; answers: Record<string, unknown> }

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('nl-BE', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }).format(new Date(iso))
}

function decodeAnswer(val: unknown, q: Question | undefined): string {
  if (val == null) return '—'
  if (!q) return JSON.stringify(val)
  if (q.type === 'alloc') {
    const a = val as { oe?: unknown; pl?: unknown; ki?: unknown }
    return `OE ${a.oe ?? 0} · PL ${a.pl ?? 0} · KI ${a.ki ?? 0}`
  }
  if (q.type === 'single') {
    return q.opts?.find(([k]) => k === val)?.[1] ?? String(val)
  }
  if (q.type === 'multi2') {
    const arr = val as string[]
    return arr.map(v => q.opts?.find(([k]) => k === v)?.[1] ?? v).join(', ')
  }
  if (q.type === 'rank') {
    const arr = val as string[]
    return arr.map((v, i) => `${i+1}. ${q.items?.find(([k]) => k === v)?.[1] ?? v}`).join(' → ')
  }
  if (q.type === 'scale') return `${val} / 7`
  return String(val)
}

const PART_COLORS: Record<string,string> = { A:'#CD0039', B:'#39B2AD', C:'#092147', D:'#8FAE73' }

export default function DashboardPage() {
  const [responses, setResponses] = useState<Response[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading]     = useState(true)
  const [expanded, setExpanded]   = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    Promise.all([
      supabase.from('survey_responses').select('*').order('created_at', { ascending: false }),
      supabase.from('questions').select('q_id,q,type,part,opts,items').order('position'),
    ]).then(([{ data: r }, { data: q }]) => {
      if (r) setResponses(r as Response[])
      if (q) setQuestions(q as Question[])
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function exportCSV() {
    const qIds = questions.map(q => q.q_id)
    const header = ['datum', 'naam', 'modus', ...qIds].join(';')
    const rows = responses.map(r => {
      const cols = [
        formatDate(r.created_at),
        r.naam ?? '',
        r.mode ?? '',
        ...qIds.map(id => {
          const q = questions.find(q => q.q_id === id)
          return decodeAnswer(r.answers[id], q).replace(/;/g, ',')
        }),
      ]
      return cols.map(c => `"${String(c).replace(/"/g,'""')}"`).join(';')
    })
    const csv = [header, ...rows].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `TMS-responses-${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }

  if (loading) {
    return <div className="text-gray-400 text-sm py-12 text-center">Laden…</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#092147]">Antwoorden</h1>
          <p className="text-gray-500 text-sm mt-0.5">{responses.length} {responses.length === 1 ? 'inzending' : 'inzendingen'}</p>
        </div>
        {responses.length > 0 && (
          <button
            onClick={exportCSV}
            className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        )}
      </div>

      {responses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">Nog geen inzendingen.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {responses.map(r => {
            const answeredCount = questions.filter(q => {
              const v = r.answers[q.q_id]
              if (v == null) return false
              if (Array.isArray(v)) return v.length > 0
              if (typeof v === 'object' && v !== null) return Object.values(v).some(x => x !== '' && x != null)
              return String(v).trim() !== ''
            }).length
            const isOpen = expanded === r.id

            return (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <button
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-[#092147] text-sm">{r.naam || 'Anoniem'}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.mode === 'core' ? 'bg-teal-50 text-teal-700' : 'bg-blue-50 text-blue-700'}`}>
                        {r.mode === 'core' ? 'Korte kern' : 'Volledig'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{formatDate(r.created_at)}</div>
                  </div>
                  <div className="text-xs text-gray-400 shrink-0">{answeredCount} / {questions.length} vragen</div>
                  <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 px-5 py-4">
                    {(['A','B','C','D'] as const).map(part => {
                      const partQs = questions.filter(q => q.part === part)
                      const partAnswers = partQs.filter(q => r.answers[q.q_id] != null)
                      if (partAnswers.length === 0) return null
                      return (
                        <div key={part} className="mb-5 last:mb-0">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: PART_COLORS[part] }}>{part}</span>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Deel {part}</span>
                          </div>
                          <div className="space-y-2">
                            {partAnswers.map(q => (
                              <div key={q.q_id} className="grid grid-cols-[80px_1fr] gap-3 text-sm">
                                <span className="text-xs font-mono text-gray-400 pt-0.5">{q.q_id}</span>
                                <div>
                                  <p className="text-gray-500 text-xs mb-0.5" dangerouslySetInnerHTML={{ __html: q.q }} />
                                  <p className="text-[#092147] font-medium">{decodeAnswer(r.answers[q.q_id], q)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
