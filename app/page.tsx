'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase-browser'
import './survey.css'

// ── Types ──────────────────────────────────────────────────────────────────
type Part = 'A' | 'B' | 'C' | 'D'
type QType = 'alloc' | 'single' | 'multi2' | 'rank' | 'text' | 'scale' | 'name'
type Mode = 'full' | 'core'

interface Question {
  id: string
  q_id: string
  position: number
  part: Part
  type: QType
  q: string
  help?: string | null
  opts?: [string, string][] | null
  items?: [string, string][] | null
  lo?: string | null
  hi?: string | null
  ph?: string | null
  core: boolean
  active: boolean
}

type AllocVal = { oe: number | ''; pl: number | ''; ki: number | '' }
type Answers  = Record<string, string | number | string[] | AllocVal>

// ── Static data ────────────────────────────────────────────────────────────
const DISC = {
  oe: { label: 'Operationele excellentie', dot: '#092147', desc: 'Betrouwbaar, vlot, scherp geprijsd. Maximaal gemak en voorspelbaarheid.' },
  pl: { label: 'Productleiderschap',       dot: '#39B2AD', desc: 'De beste, meest geavanceerde oplossing. Voorop in vakmanschap.' },
  ki: { label: 'Klantintimiteit',          dot: '#CD0039', desc: 'De klant en zijn installatie door en door kennen. Maatwerk, partnerschap.' },
} as const

const PART: Record<string, { name: string; color: string }> = {
  A: { name: 'Deel A \u00b7 Vandaag vs. ambitie',       color: '#CD0039' },
  B: { name: 'Deel B \u00b7 Hoe we winnen en kiezen',   color: '#39B2AD' },
  C: { name: 'Deel C \u00b7 In je eigen woorden',       color: '#092147' },
  D: { name: 'Deel D \u00b7 Afstemming',                color: '#8FAE73' },
}

const LOGO = '/tms-logo.png'
const LOGO_FILTER_WHITE = 'brightness(0) invert(1)'

// ── Small SVG icon components ──────────────────────────────────────────────
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  )
}
function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6"/>
    </svg>
  )
}
function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────
function hexRGB(h: string) {
  const hex = h.replace('#', '')
  return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)].join(',')
}

function hasAnswer(answers: Answers, id: string): boolean {
  const v = answers[id]
  if (v == null) return false
  if (Array.isArray(v)) return v.length > 0
  if (typeof v === 'object') return Object.values(v).some(x => x !== '' && x != null)
  return String(v).trim() !== ''
}

function buildOutput(questions: Question[], mode: Mode, answers: Answers): string {
  const qs = questions.filter(q => mode === 'full' || q.core)
  const L: string[] = ['TMS \u00b7 Positioneringssurvey \u2014 antwoorden', 'Naam / rol: ' + (answers.naam || '\u2014'), '']
  for (const q of qs) {
    if (q.type === 'name') continue
    const ans = answers[q.q_id]
    if (!ans) continue
    let val = ''
    if (q.type === 'alloc') {
      const a = ans as AllocVal
      val = `OE ${a.oe||0} \u00b7 PL ${a.pl||0} \u00b7 KI ${a.ki||0}`
    } else if (q.type === 'single') {
      val = q.opts?.find(([k]) => k === ans)?.[1] ?? String(ans)
    } else if (q.type === 'multi2') {
      val = (ans as string[]).map(v => q.opts?.find(([k]) => k === v)?.[1] ?? v).join(' | ')
    } else if (q.type === 'rank') {
      val = (ans as string[]).map((v, i) => `${i+1}. ${q.items?.find(([k]) => k === v)?.[1] ?? v}`).join(' | ')
    } else if (q.type === 'scale') {
      val = `${ans}/7`
    } else {
      val = String(ans)
    }
    L.push(`${q.q_id}: ${val}`)
  }
  return L.join('\n')
}

// ── Question body components ───────────────────────────────────────────────
function SingleOpts({ q, answers, setAnswer, onAdvance }: {
  q: Question; answers: Answers
  setAnswer: (id: string, v: string) => void
  onAdvance: () => void
}) {
  const sel = answers[q.q_id] as string | undefined
  return (
    <div className="opts">
      {(q.opts ?? []).map(([value, label]) => (
        <button
          key={value}
          className={`opt${sel === value ? ' sel' : ''}`}
          onClick={() => { setAnswer(q.q_id, value); setTimeout(onAdvance, 360) }}
        >
          <span className="ot">{label}</span>
          <span className="tick"><CheckIcon /></span>
        </button>
      ))}
    </div>
  )
}

function MultiOpts({ q, answers, setAnswer }: {
  q: Question; answers: Answers
  setAnswer: (id: string, v: string[]) => void
}) {
  const sel = (answers[q.q_id] as string[] | undefined) ?? []
  const toggle = (value: string) => {
    const i = sel.indexOf(value)
    if (i >= 0) setAnswer(q.q_id, sel.filter(v => v !== value))
    else if (sel.length < 2) setAnswer(q.q_id, [...sel, value])
  }
  return (
    <div className="opts">
      {(q.opts ?? []).map(([value, label]) => {
        const on = sel.includes(value)
        const disabled = !on && sel.length >= 2
        return (
          <button
            key={value}
            className={`opt${on ? ' sel' : ''}${disabled ? ' disabled' : ''}`}
            onClick={() => toggle(value)}
          >
            <span className="ot">{label}</span>
            <span className="tick"><CheckIcon /></span>
          </button>
        )
      })}
    </div>
  )
}

function RankOpts({ q, answers, setAnswer }: {
  q: Question; answers: Answers
  setAnswer: (id: string, v: string[]) => void
}) {
  const sel = (answers[q.q_id] as string[] | undefined) ?? []
  const toggle = (value: string) => {
    const i = sel.indexOf(value)
    if (i >= 0) setAnswer(q.q_id, sel.filter(v => v !== value))
    else setAnswer(q.q_id, [...sel, value])
  }
  return (
    <div className="opts">
      {(q.items ?? []).map(([value, label]) => {
        const rank = sel.indexOf(value)
        const on = rank >= 0
        return (
          <button key={value} className={`opt${on ? ' sel' : ''}`} onClick={() => toggle(value)}>
            <span className="rank-badge">{on ? rank + 1 : ''}</span>
            <span className="ot">{label}</span>
          </button>
        )
      })}
    </div>
  )
}

function AllocInputs({ q, answers, setAnswer }: {
  q: Question; answers: Answers
  setAnswer: (id: string, v: AllocVal) => void
}) {
  const a = (answers[q.q_id] as AllocVal | undefined) ?? { oe: '', pl: '', ki: '' }
  const keys = Object.keys(DISC) as (keyof typeof DISC)[]
  const total = keys.reduce((s, k) => s + (Number(a[k]) || 0), 0)

  const update = (k: keyof typeof DISC, raw: number | '') => {
    setAnswer(q.q_id, { ...a, [k]: raw })
  }
  const step = (k: keyof typeof DISC, delta: number) => {
    const v = Math.max(0, Math.min(100, (Number(a[k]) || 0) + delta))
    update(k, v)
  }

  return (
    <>
      <div className="alloc">
        {keys.map(k => {
          const d = DISC[k]
          const val = a[k]
          const pct = Math.min(Number(val) || 0, 100)
          return (
            <div key={k} className="arow">
              <div className="top">
                <span className="dot" style={{ background: d.dot }} />
                <span className="name">{d.label}</span>
              </div>
              <div className="stepper">
                <button className="sbtn" onClick={() => step(k, -5)} aria-label="min">&minus;</button>
                <input
                  className="ninput"
                  inputMode="numeric"
                  value={val === '' ? '' : val}
                  placeholder="0"
                  maxLength={3}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 3)
                    update(k, raw === '' ? '' : Math.min(100, parseInt(raw)))
                  }}
                />
                <button className="sbtn" onClick={() => step(k, 5)} aria-label="plus">+</button>
              </div>
              <div className="abar"><i style={{ width: pct + '%', background: d.dot }} /></div>
            </div>
          )
        })}
      </div>
      <div className={`total${total === 100 ? ' ok' : total > 100 ? ' over' : ''}`}>
        <span>Totaal</span>
        <span className="badge">{total}</span>
        <span>/ 100</span>
      </div>
    </>
  )
}

function ScaleInput({ q, answers, setAnswer, onAdvance }: {
  q: Question; answers: Answers
  setAnswer: (id: string, v: number) => void
  onAdvance: () => void
}) {
  const sel = answers[q.q_id] as number | undefined
  return (
    <>
      <div className="ends"><span>{q.lo}</span><span>{q.hi}</span></div>
      <div className="scale">
        {[1,2,3,4,5,6,7].map(n => (
          <button
            key={n}
            className={`sc${sel === n ? ' sel' : ''}`}
            onClick={() => { setAnswer(q.q_id, n); setTimeout(onAdvance, 360) }}
          >{n}</button>
        ))}
      </div>
    </>
  )
}

function TextInput({ q, answers, setAnswer }: {
  q: Question; answers: Answers
  setAnswer: (id: string, v: string) => void
}) {
  return (
    <textarea
      placeholder={q.ph ?? ''}
      value={(answers[q.q_id] as string) ?? ''}
      onChange={e => setAnswer(q.q_id, e.target.value)}
    />
  )
}

function NameInput({ q, answers, setAnswer }: {
  q: Question; answers: Answers
  setAnswer: (id: string, v: string) => void
}) {
  return (
    <input
      className="tinput"
      placeholder={q.ph ?? ''}
      value={(answers[q.q_id] as string) ?? ''}
      onChange={e => setAnswer(q.q_id, e.target.value)}
    />
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function SurveyPage() {
  const [questions, setQuestions]   = useState<Question[]>([])
  const [loading, setLoading]       = useState(true)
  const [mode, setMode]             = useState<Mode>('full')
  const [pos, setPos]               = useState(0)
  const [answers, setAnswers]       = useState<Answers>({})
  const [dbStatus, setDbStatus]     = useState<{ msg: string; color: string } | null>(null)
  const savedRef                    = useRef(false)
  const supabase                    = createClient()

  // Load questions
  useEffect(() => {
    supabase
      .from('questions')
      .select('*')
      .eq('active', true)
      .order('position')
      .then(({ data }) => {
        if (data) setQuestions(data as Question[])
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeQs     = useMemo(() => questions.filter(q => mode === 'full' || q.core), [questions, mode])
  const screens      = useMemo(() => ['intro', ...activeQs.map(q => q.q_id), 'done'], [activeQs])
  const currentId    = screens[pos] ?? 'intro'
  const isHero       = currentId === 'intro' || currentId === 'done'
  const isIntro      = currentId === 'intro'
  const isDone       = currentId === 'done'
  const currentQ     = questions.find(q => q.q_id === currentId)
  const qIndex       = activeQs.findIndex(q => q.q_id === currentId)
  const isLastQ      = pos === screens.length - 2
  const progress     = isIntro ? 0 : isDone ? 100 : (qIndex / activeQs.length) * 100

  // Compute whether Next is enabled
  const nextEnabled = useMemo(() => {
    if (isIntro || isDone) return true
    if (!currentQ) return false
    if (currentQ.type === 'text' || currentQ.type === 'name') return true
    if (currentQ.type === 'alloc') {
      const a = answers[currentQ.q_id] as AllocVal | undefined
      if (!a) return false
      return (Number(a.oe)||0) + (Number(a.pl)||0) + (Number(a.ki)||0) === 100
    }
    return hasAnswer(answers, currentQ.q_id)
  }, [isIntro, isDone, currentQ, answers])

  // Sync nextEnabled to ref for keyboard handler
  const nextEnabledRef = useRef(nextEnabled)
  useEffect(() => { nextEnabledRef.current = nextEnabled }, [nextEnabled])

  // Set CSS accent variable
  useEffect(() => {
    const color = isHero ? '#CD0039' : (currentQ ? PART[currentQ.part]?.color : '#CD0039') ?? '#CD0039'
    document.documentElement.style.setProperty('--accent', color)
    document.documentElement.style.setProperty('--accent-soft', `rgba(${hexRGB(color)},.09)`)
  }, [currentId, questions])

  const advance = useCallback(() => {
    setPos(p => Math.min(p + 1, screens.length - 1))
  }, [screens.length])

  // Keyboard: Enter to advance
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return
      if (e.target instanceof HTMLElement && e.target.tagName === 'TEXTAREA') return
      if (nextEnabledRef.current) advance()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [advance])

  // Save once when done screen is reached
  useEffect(() => {
    if (isDone && !savedRef.current) {
      savedRef.current = true
      saveResponse()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone])

  const setAnswer = useCallback((qId: string, value: Answers[string]) => {
    setAnswers(prev => ({ ...prev, [qId]: value }))
  }, [])

  async function saveResponse() {
    setDbStatus({ msg: 'Opslaan in database\u2026', color: 'rgba(255,255,255,.5)' })
    try {
      const { error } = await supabase.from('survey_responses').insert({
        naam: (answers.naam as string) || null,
        mode,
        answers,
      })
      if (error) {
        console.error('Supabase insert error:', error.code, error.message, error.details)
        setDbStatus({ msg: `\u26a0 Opslaan mislukt (${error.code ?? error.message}) \u2013 gebruik "Kopieer" als back-up.`, color: '#FF6B6B' })
      } else {
        setDbStatus({ msg: '\u2713 Antwoorden opgeslagen', color: '#39B2AD' })
      }
    } catch {
      setDbStatus({ msg: '\u26a0 Opslaan mislukt \u2013 gebruik "Kopieer" als back-up.', color: '#FF6B6B' })
    }
  }

  function doCopy(btn: HTMLButtonElement) {
    const txt = buildOutput(questions, mode, answers)
    const original = btn.innerHTML
    const done = () => { btn.innerHTML = '\u2713 Gekopieerd'; setTimeout(() => { btn.innerHTML = original }, 1800) }
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(txt).then(done).catch(() => fallback(txt, done))
    else fallback(txt, done)
  }
  function fallback(txt: string, done: () => void) {
    const t = document.createElement('textarea')
    t.value = txt; t.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(t); t.select()
    try { document.execCommand('copy'); done() } catch { alert(txt) }
    document.body.removeChild(t)
  }
  function doDownload() {
    const txt = buildOutput(questions, mode, answers)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }))
    a.download = 'TMS-survey-' + ((answers.naam as string || 'antwoord').replace(/[^a-z0-9]+/gi,'-').toLowerCase()) + '.txt'
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }

  if (loading) {
    return (
      <div className="app hero" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ color:'rgba(255,255,255,.6)', fontFamily:"'Sora',sans-serif" }}>Laden\u2026</span>
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className={`app${isHero ? ' hero' : ''}`}>
      <div className="shape" aria-hidden="true" />

      <header className="topbar" style={{ visibility: isIntro ? 'hidden' : 'visible' }}>
        <button className="back" disabled={pos <= 1} onClick={() => setPos(p => Math.max(p-1,0))} aria-label="Vorige">
          <BackIcon />
        </button>
        <div className="prog"><div className="prog-fill" style={{ width: `${progress}%` }} /></div>
        <img className="brand-mono" src={LOGO} alt="TMS" />
      </header>

      {/* ── Intro ────────────────────────────────────────────────────────── */}
      {isIntro && (
        <>
          <main className="screen">
            <div className="wrap reveal">
              <img className="hero-mono" src={LOGO} alt="TMS" />
              <p className="eyebrow" style={{ color:'var(--teal)' }}>Strategische positionering &middot; Treacy &amp; Wiersema</p>
              <h1 className="q">Positioneringssurvey</h1>
              <p className="help">Leg v&oacute;&oacute;r de werksessie individueel vast waar TMS volgens jou staat en waar we naartoe moeten. Er zijn geen juiste of foute antwoorden &mdash; net de verschillen tussen ons maken het gesprek waardevol.</p>
              <div className="disc-list">
                {(Object.entries(DISC) as [keyof typeof DISC, typeof DISC[keyof typeof DISC]][]).map(([, d]) => (
                  <div key={d.label} className="disc">
                    <span className="dot" style={{ background: d.dot }} />
                    <span><b>{d.label}</b> &mdash; {d.desc}</span>
                  </div>
                ))}
              </div>
              <div className="modes">
                {(['full','core'] as const).map(m => (
                  <button key={m} className={`mode${mode===m?' sel':''}`} onClick={() => setMode(m)}>
                    <span className="mt"><span className="mtick"><CheckIcon /></span>{m==='full'?'Volledige survey':'Korte kern'}</span>
                    <span className="md">{m==='full'?'15 vragen \u00b7 \u00b1 15 min':'9 vragen \u00b7 \u00b1 10 min'}</span>
                  </button>
                ))}
              </div>
            </div>
          </main>
          <footer className="footer">
            <button className="btn btn-primary" onClick={advance}>Start <span><ArrowIcon /></span></button>
            <span className="keyhint">druk <b>Enter &#x23ce;</b></span>
          </footer>
        </>
      )}

      {/* ── Done ─────────────────────────────────────────────────────────── */}
      {isDone && (
        <>
          <main className="screen">
            <div className="wrap reveal" style={{ textAlign:'center' }}>
              <img className="hero-mono" src={LOGO} alt="TMS" style={{ marginInline:'auto', filter: LOGO_FILTER_WHITE }} />
              <h1 className="q" style={{ textAlign:'center' }}>Bedankt &mdash; dit is binnen.</h1>
              <p className="help" style={{ marginInline:'auto', textAlign:'center' }}>
                Je antwoorden zijn klaar. We bespreken de <b style={{ color:'#fff', fontWeight:600 }}>geaggregeerde</b> resultaten samen binnen StratCom.
              </p>
              <p className="foot-note" style={{ textAlign:'center' }}>
                {activeQs.filter(q => hasAnswer(answers, q.q_id)).length} van {activeQs.length} vragen ingevuld.
              </p>
              {dbStatus && (
                <p className="foot-note" style={{ textAlign:'center', color: dbStatus.color, transition:'color .4s' }}>
                  {dbStatus.msg}
                </p>
              )}
            </div>
          </main>
          <footer className="footer" style={{ flexWrap:'wrap' }}>
            <button className="btn btn-on-dark" onClick={e => doCopy(e.currentTarget)}>
              <span><ArrowIcon /></span> Kopieer mijn antwoorden
            </button>
            <button className="btn btn-ghost" style={{ color:'rgba(255,255,255,.7)' }} onClick={doDownload}>
              Download .txt
            </button>
          </footer>
        </>
      )}

      {/* ── Question ─────────────────────────────────────────────────────── */}
      {currentQ && (
        <>
          <main className="screen" key={currentQ.q_id}>
            <div className="wrap reveal">
              <p className="eyebrow">
                <span className="qn">{currentQ.q_id.toUpperCase()}</span>
                {PART[currentQ.part]?.name}
              </p>
              <h2 className="q" dangerouslySetInnerHTML={{ __html: currentQ.q }} />
              {currentQ.help && <p className="help">{currentQ.help}</p>}

              {currentQ.type === 'single' && (
                <SingleOpts q={currentQ} answers={answers} setAnswer={setAnswer} onAdvance={advance} />
              )}
              {currentQ.type === 'multi2' && (
                <MultiOpts q={currentQ} answers={answers} setAnswer={setAnswer} />
              )}
              {currentQ.type === 'rank' && (
                <RankOpts q={currentQ} answers={answers} setAnswer={setAnswer} />
              )}
              {currentQ.type === 'alloc' && (
                <AllocInputs q={currentQ} answers={answers} setAnswer={setAnswer} />
              )}
              {currentQ.type === 'scale' && (
                <ScaleInput q={currentQ} answers={answers} setAnswer={setAnswer} onAdvance={advance} />
              )}
              {currentQ.type === 'text' && (
                <TextInput q={currentQ} answers={answers} setAnswer={setAnswer} />
              )}
              {currentQ.type === 'name' && (
                <NameInput q={currentQ} answers={answers} setAnswer={setAnswer} />
              )}
            </div>
          </main>
          <footer className="footer">
            <button className="btn btn-primary" disabled={!nextEnabled} onClick={advance}>
              {isLastQ ? 'Afronden' : 'Volgende'} <span><ArrowIcon /></span>
            </button>
            <span className="keyhint">
              {currentQ.type === 'single' || currentQ.type === 'scale'
                ? 'tik om te kiezen'
                : <><b>Enter &#x23ce;</b></>}
            </span>
          </footer>
        </>
      )}
    </div>
  )
}
