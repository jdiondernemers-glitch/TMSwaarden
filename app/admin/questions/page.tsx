'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

type Part   = 'A' | 'B' | 'C' | 'D'
type QType  = 'alloc' | 'single' | 'multi2' | 'rank' | 'text' | 'scale' | 'name'

interface Question {
  id: string
  q_id: string
  position: number
  part: Part
  type: QType
  q: string
  help: string | null
  opts: [string, string][] | null
  items: [string, string][] | null
  lo: string | null
  hi: string | null
  ph: string | null
  core: boolean
  active: boolean
}

type DraftQuestion = Omit<Question, 'id' | 'created_at'>

const EMPTY_DRAFT: DraftQuestion = {
  q_id: '', position: 99, part: 'A', type: 'single',
  q: '', help: null, opts: [['a',''], ['b','']], items: null,
  lo: null, hi: null, ph: null, core: false, active: true,
}

const PART_LABELS: Record<Part, string> = {
  A: 'Deel A \u00b7 Vandaag vs. ambitie',
  B: 'Deel B \u00b7 Hoe we winnen en kiezen',
  C: 'Deel C \u00b7 In je eigen woorden',
  D: 'Deel D \u00b7 Afstemming',
}
const PART_COLORS: Record<Part, string> = { A:'#CD0039', B:'#39B2AD', C:'#092147', D:'#8FAE73' }

const TYPE_LABELS: Record<QType, string> = {
  alloc: 'Verdeling (100 pt)', single: 'Enkelvoudige keuze', multi2: 'Top-2 keuze',
  rank: 'Rangschikking', text: 'Open tekstveld', scale: 'Schaal 1\u20137', name: 'Naam / rol',
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState<'add' | 'edit' | null>(null)
  const [draft, setDraft]         = useState<DraftQuestion>(EMPTY_DRAFT)
  const [editId, setEditId]       = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const supabase = createClient()

  async function load() {
    const { data } = await supabase.from('questions').select('*').order('position')
    if (data) setQuestions(data as Question[])
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  function openAdd() {
    const maxPos = questions.reduce((m, q) => Math.max(m, q.position), 0)
    setDraft({ ...EMPTY_DRAFT, position: maxPos + 1 })
    setEditId(null)
    setError(null)
    setModal('add')
  }

  function openEdit(q: Question) {
    setDraft({
      q_id: q.q_id, position: q.position, part: q.part, type: q.type,
      q: q.q, help: q.help, opts: q.opts ?? [['a',''],['b','']], items: q.items ?? [['a',''],['b','']],
      lo: q.lo, hi: q.hi, ph: q.ph, core: q.core, active: q.active,
    })
    setEditId(q.id)
    setError(null)
    setModal('edit')
  }

  async function save() {
    if (!draft.q_id.trim() || !draft.q.trim()) {
      setError('Vul minstens een ID en de vraagtekst in.')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      q_id: draft.q_id.trim().toUpperCase(),
      position: Number(draft.position),
      part: draft.part,
      type: draft.type,
      q: draft.q,
      help: draft.help || null,
      opts: needsOpts(draft.type) ? draft.opts : null,
      items: draft.type === 'rank' ? draft.items : null,
      lo: draft.type === 'scale' ? draft.lo : null,
      hi: draft.type === 'scale' ? draft.hi : null,
      ph: (draft.type === 'text' || draft.type === 'name') ? draft.ph : null,
      core: draft.core,
      active: draft.active,
    }

    if (modal === 'add') {
      const { error } = await supabase.from('questions').insert(payload)
      if (error) { setError(error.message); setSaving(false); return }
    } else if (editId) {
      const { error } = await supabase.from('questions').update(payload).eq('id', editId)
      if (error) { setError(error.message); setSaving(false); return }
    }

    setSaving(false)
    setModal(null)
    await load()
  }

  async function toggleActive(q: Question) {
    await supabase.from('questions').update({ active: !q.active }).eq('id', q.id)
    setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, active: !x.active } : x))
  }

  async function movePosition(q: Question, dir: -1 | 1) {
    const sorted = [...questions].sort((a, b) => a.position - b.position)
    const idx = sorted.findIndex(x => x.id === q.id)
    const swap = sorted[idx + dir]
    if (!swap) return
    await Promise.all([
      supabase.from('questions').update({ position: swap.position }).eq('id', q.id),
      supabase.from('questions').update({ position: q.position }).eq('id', swap.id),
    ])
    await load()
  }

  function needsOpts(type: QType) { return type === 'single' || type === 'multi2' }

  function setOptKey(i: number, val: string) {
    const opts = [...(draft.opts ?? [])] as [string,string][]
    opts[i] = [val, opts[i]?.[1] ?? '']
    setDraft(d => ({ ...d, opts }))
  }
  function setOptLabel(i: number, val: string) {
    const opts = [...(draft.opts ?? [])] as [string,string][]
    opts[i] = [opts[i]?.[0] ?? '', val]
    setDraft(d => ({ ...d, opts }))
  }
  function addOpt() {
    const opts = [...(draft.opts ?? []), ['', ''] as [string,string]]
    setDraft(d => ({ ...d, opts }))
  }
  function removeOpt(i: number) {
    setDraft(d => ({ ...d, opts: (d.opts ?? []).filter((_, j) => j !== i) }))
  }

  function setItemKey(i: number, val: string) {
    const items = [...(draft.items ?? [])] as [string,string][]
    items[i] = [val, items[i]?.[1] ?? '']
    setDraft(d => ({ ...d, items }))
  }
  function setItemLabel(i: number, val: string) {
    const items = [...(draft.items ?? [])] as [string,string][]
    items[i] = [items[i]?.[0] ?? '', val]
    setDraft(d => ({ ...d, items }))
  }
  function addItem() {
    setDraft(d => ({ ...d, items: [...(d.items ?? []), ['', '']] }))
  }
  function removeItem(i: number) {
    setDraft(d => ({ ...d, items: (d.items ?? []).filter((_, j) => j !== i) }))
  }

  const sorted = [...questions].sort((a, b) => a.position - b.position)

  if (loading) return <div className="text-gray-400 text-sm py-12 text-center">Laden\u2026</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#092147]">Survey vragen</h1>
          <p className="text-gray-500 text-sm mt-0.5">{questions.filter(q=>q.active).length} actief, {questions.filter(q=>!q.active).length} inactief</p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-[#092147] text-white text-sm font-semibold rounded-xl hover:bg-[#0d2d5e] transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Vraag toevoegen
        </button>
      </div>

      <div className="space-y-2">
        {sorted.map((q, idx) => (
          <div key={q.id} className={`bg-white rounded-2xl border transition-colors ${q.active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => movePosition(q, -1)} disabled={idx === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors leading-none" aria-label="Omhoog">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/></svg>
                </button>
                <button onClick={() => movePosition(q, 1)} disabled={idx === sorted.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors leading-none" aria-label="Omlaag">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                </button>
              </div>

              <span className="font-mono text-xs font-bold text-gray-400 w-10 shrink-0">{q.q_id}</span>

              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PART_COLORS[q.part] }} />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#092147] truncate" dangerouslySetInnerHTML={{ __html: q.q }} />
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-gray-400">{TYPE_LABELS[q.type]}</span>
                  {q.core && <span className="text-xs bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-2 py-0">kern</span>}
                  {!q.active && <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0">inactief</span>}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEdit(q)}
                  className="p-2 text-gray-400 hover:text-[#092147] hover:bg-gray-50 rounded-lg transition-colors"
                  title="Bewerken"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button
                  onClick={() => toggleActive(q)}
                  className={`p-2 rounded-lg transition-colors ${q.active ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
                  title={q.active ? 'Deactiveren' : 'Activeren'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    {q.active
                      ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      : <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    }
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Modal ──────────────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-[#092147]">
                {modal === 'add' ? 'Nieuwe vraag toevoegen' : 'Vraag bewerken'}
              </h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-700 transition-colors p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Row 1: ID + Part */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Vraag-ID <span className="text-red-400">*</span></label>
                  <input
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#092147]/20 focus:border-[#092147] font-mono uppercase"
                    placeholder="E.g. E1"
                    value={draft.q_id}
                    onChange={e => setDraft(d => ({ ...d, q_id: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Deel</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#092147]/20"
                    value={draft.part}
                    onChange={e => setDraft(d => ({ ...d, part: e.target.value as Part }))}
                  >
                    {(['A','B','C','D'] as Part[]).map(p => (
                      <option key={p} value={p}>{PART_LABELS[p]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Type + Position */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#092147]/20"
                    value={draft.type}
                    onChange={e => setDraft(d => ({ ...d, type: e.target.value as QType }))}
                  >
                    {(Object.entries(TYPE_LABELS) as [QType, string][]).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Positie</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#092147]/20"
                    value={draft.position}
                    min={1}
                    onChange={e => setDraft(d => ({ ...d, position: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>

              {/* Question text */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Vraagtekst <span className="text-red-400">*</span></label>
                <textarea
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#092147]/20 resize-none"
                  rows={2}
                  placeholder='Mag HTML bevatten, bv. <em class="k">woord</em>'
                  value={draft.q}
                  onChange={e => setDraft(d => ({ ...d, q: e.target.value }))}
                />
              </div>

              {/* Help text */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Helptekst <span className="text-gray-400">(optioneel)</span></label>
                <input
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#092147]/20"
                  value={draft.help ?? ''}
                  onChange={e => setDraft(d => ({ ...d, help: e.target.value || null }))}
                />
              </div>

              {/* Options (single / multi2) */}
              {needsOpts(draft.type) && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Antwoordopties</label>
                  <div className="space-y-2">
                    {(draft.opts ?? []).map(([k, l], i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          className="w-16 px-2 py-1.5 text-xs border border-gray-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#092147]/30"
                          placeholder="key"
                          value={k}
                          onChange={e => setOptKey(i, e.target.value)}
                        />
                        <input
                          className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#092147]/30"
                          placeholder="label"
                          value={l}
                          onChange={e => setOptLabel(i, e.target.value)}
                        />
                        <button onClick={() => removeOpt(i)} className="text-gray-300 hover:text-red-400 transition-colors px-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button onClick={addOpt} className="text-xs text-[#39B2AD] hover:text-[#2a8a86] font-medium transition-colors">+ Optie toevoegen</button>
                  </div>
                </div>
              )}

              {/* Items (rank) */}
              {draft.type === 'rank' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Rangschikkingsitems</label>
                  <div className="space-y-2">
                    {(draft.items ?? []).map(([k, l], i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          className="w-16 px-2 py-1.5 text-xs border border-gray-200 rounded-lg font-mono focus:outline-none"
                          placeholder="key"
                          value={k}
                          onChange={e => setItemKey(i, e.target.value)}
                        />
                        <input
                          className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none"
                          placeholder="label"
                          value={l}
                          onChange={e => setItemLabel(i, e.target.value)}
                        />
                        <button onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-400 transition-colors px-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button onClick={addItem} className="text-xs text-[#39B2AD] hover:text-[#2a8a86] font-medium">+ Item toevoegen</button>
                  </div>
                </div>
              )}

              {/* Scale labels */}
              {draft.type === 'scale' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Label links (1)</label>
                    <input className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" value={draft.lo ?? ''} onChange={e => setDraft(d => ({ ...d, lo: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Label rechts (7)</label>
                    <input className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" value={draft.hi ?? ''} onChange={e => setDraft(d => ({ ...d, hi: e.target.value }))} />
                  </div>
                </div>
              )}

              {/* Placeholder */}
              {(draft.type === 'text' || draft.type === 'name') && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Placeholder</label>
                  <input className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" value={draft.ph ?? ''} onChange={e => setDraft(d => ({ ...d, ph: e.target.value || null }))} />
                </div>
              )}

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded" checked={draft.core} onChange={e => setDraft(d => ({ ...d, core: e.target.checked }))} />
                  <span className="text-sm text-gray-700">Kern (verplicht in korte versie)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded" checked={draft.active} onChange={e => setDraft(d => ({ ...d, active: e.target.checked }))} />
                  <span className="text-sm text-gray-700">Actief</span>
                </label>
              </div>

              {error && <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
            </div>

            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button onClick={() => setModal(null)} className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Annuleren
              </button>
              <button onClick={save} disabled={saving} className="px-5 py-2.5 text-sm font-semibold bg-[#092147] text-white rounded-xl hover:bg-[#0d2d5e] disabled:opacity-50 transition-colors">
                {saving ? 'Opslaan\u2026' : modal === 'add' ? 'Toevoegen' : 'Opslaan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
