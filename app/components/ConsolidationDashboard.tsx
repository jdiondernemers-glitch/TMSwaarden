'use client'

import { useMemo, useState } from 'react'
import type { Person } from '@/lib/consolidation-types'

const NAVY = '#092147'
const SIDE = '#0E2A55'
const OFFWHITE = '#F5F0EC'
const INK = '#1A1A1A'
const GREY = '#667780'
const LIGHTBLUE = '#D9E1EC'

const DISCIPLINES = [
  { key: 'CI' as const, name: 'Customer Intimacy', short: 'Intimiteit', color: '#7FB069' },
  { key: 'OE' as const, name: 'Operational Excellence', short: 'Excellence', color: '#39B2AD' },
  { key: 'PL' as const, name: 'Product Leadership', short: 'Leadership', color: '#CD0039' },
]
const dc = (k: string) => DISCIPLINES.find(d => d.key === k)!

const DIMENSIONS = [
  { key: 'belofte' as const, label: 'Belofte aan de klant', short: 'Belofte' },
  { key: 'kernproces' as const, label: 'Kernproces', short: 'Kernproces' },
  { key: 'cultuur' as const, label: 'Organisatie & cultuur', short: 'Organisatie' },
  { key: 'meetlat' as const, label: 'Meetlat (waar we op sturen)', short: 'Meetlat' },
  { key: 'relatie' as const, label: 'Klantrelatie', short: 'Klantrelatie' },
]

type Totals = { CI: number; OE: number; PL: number }

const totalsOf = (alloc: Person['alloc']): Totals => {
  const t: Totals = { CI: 0, OE: 0, PL: 0 }
  DIMENSIONS.forEach(d =>
    DISCIPLINES.forEach(di => { t[di.key] += alloc[d.key][di.key] }))
  return t
}

const dominantOf = (t: Totals) =>
  DISCIPLINES.map(d => ({ k: d.key, v: t[d.key] })).sort((a, b) => b.v - a.v)[0].k

const mean = (arr: number[]) => arr.reduce((s, x) => s + x, 0) / arr.length

const std = (arr: number[]) => {
  const m = mean(arr)
  return Math.sqrt(mean(arr.map(x => (x - m) ** 2)))
}

const roundTo100 = (obj: Totals): Totals => {
  const items = DISCIPLINES.map(d => ({ k: d.key, f: obj[d.key] }))
  const floors = items.map(it => ({ k: it.k, base: Math.floor(it.f), rem: it.f - Math.floor(it.f) }))
  const used = floors.reduce((s, x) => s + x.base, 0)
  const left = 100 - used
  floors.sort((a, b) => b.rem - a.rem)
  const out = { CI: 0, OE: 0, PL: 0 }
  floors.forEach((x, i) => { out[x.k as keyof Totals] = x.base + (i < left ? 1 : 0) })
  return out
}

const TRI = { L: 42, T: 40, W: 256, H: 222 }
const ternaryXY = (t: Totals) => {
  const s = t.CI + t.OE + t.PL || 1
  const ci = t.CI / s
  const pl = t.PL / s
  const ux = 0.5 * ci + pl
  const uy = 1 - ci
  return { x: TRI.L + ux * TRI.W, y: TRI.T + uy * TRI.H }
}

function StackBar({ vals, denom, h = 12 }: { vals: Totals; denom: number; h?: number }) {
  return (
    <div style={{ display: 'flex', height: h, borderRadius: 6, overflow: 'hidden', background: LIGHTBLUE }}>
      {DISCIPLINES.map(d => (
        <div
          key={d.key}
          title={`${d.name}: ${Math.round(vals[d.key])}`}
          style={{ width: `${(vals[d.key] / denom) * 100}%`, background: d.color }}
        />
      ))}
    </div>
  )
}

interface Props {
  people: Person[]
  eyebrowLabel?: string
}

export default function ConsolidationDashboard({ people, eyebrowLabel = 'TMS · Waardestrategie' }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)

  const model = useMemo(() => {
    const enriched = people.map((p, i) => {
      const t = totalsOf(p.alloc)
      return { ...p, i, totals: t, dom: dominantOf(t) }
    })

    const avgF = {
      CI: mean(enriched.map(p => p.totals.CI)),
      OE: mean(enriched.map(p => p.totals.OE)),
      PL: mean(enriched.map(p => p.totals.PL)),
    }
    const team = roundTo100(avgF)
    const sortedTeam = DISCIPLINES.map(d => ({ ...d, v: team[d.key] })).sort((a, b) => b.v - a.v)
    const gap = sortedTeam[0].v - sortedTeam[1].v
    const verdict = gap >= 15 ? 'een duidelijke keuze'
      : gap >= 6 ? 'een voorsprong met nuance'
      : 'geen uitgesproken keuze — sterk verdeeld'

    const stds = {
      CI: std(enriched.map(p => p.totals.CI)),
      OE: std(enriched.map(p => p.totals.OE)),
      PL: std(enriched.map(p => p.totals.PL)),
    }
    const avgStd = (stds.CI + stds.OE + stds.PL) / 3
    const alignLabel = avgStd < 8 ? 'Sterk uitgelijnd'
      : avgStd <= 15 ? 'Grotendeels uitgelijnd, met nuance'
      : 'Verdeeld — expliciete keuze nodig'
    const alignColor = avgStd < 8 ? '#7FB069' : avgStd <= 15 ? '#39B2AD' : '#CD0039'

    const ranges: Record<string, { min: number; max: number; avg: number }> = {}
    DISCIPLINES.forEach(d => {
      const vals = enriched.map(p => p.totals[d.key])
      ranges[d.key] = { min: Math.min(...vals), max: Math.max(...vals), avg: team[d.key] }
    })

    const dims = DIMENSIONS.map(d => {
      const avg = {
        CI: mean(enriched.map(p => p.alloc[d.key].CI)),
        OE: mean(enriched.map(p => p.alloc[d.key].OE)),
        PL: mean(enriched.map(p => p.alloc[d.key].PL)),
      }
      const leader = DISCIPLINES.map(di => ({ k: di.key, v: avg[di.key] })).sort((a, b) => b.v - a.v)[0].k
      const disp = (
        std(enriched.map(p => p.alloc[d.key].CI)) +
        std(enriched.map(p => p.alloc[d.key].OE)) +
        std(enriched.map(p => p.alloc[d.key].PL))
      ) / 3
      return { ...d, avg, leader, disp }
    })

    const tally: Record<string, number> = {}
    dims.forEach(d => { tally[d.leader] = (tally[d.leader] || 0) + 1 })
    const majorityDir = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0]
    const divergent = dims.filter(d => d.leader !== majorityDir)

    const leaderTally: Record<string, number> = {}
    enriched.forEach(p => { leaderTally[p.dom] = (leaderTally[p.dom] || 0) + 1 })
    const leaderCounts = DISCIPLINES
      .map(d => ({ k: d.key, n: leaderTally[d.key] || 0 }))
      .filter(x => x.n > 0)
      .sort((a, b) => b.n - a.n)

    return {
      people: enriched, team, sortedTeam, gap, verdict, stds, avgStd, alignLabel,
      alignColor, ranges, dims, majorityDir, divergent, leaderCounts,
    }
  }, [people])

  const { people: enriched, team, sortedTeam, verdict, avgStd, alignLabel, alignColor,
          ranges, dims, majorityDir, divergent, leaderCounts } = model
  const leader = sortedTeam[0]

  const findings: string[] = []
  findings.push(
    `Leidende discipline (team): ${leader.name} — gemiddeld ${leader.v}/100, ` +
    `tegenover ${sortedTeam[1].v} voor ${sortedTeam[1].name}. Dit is ${verdict}.`
  )
  if (divergent.length === 0) {
    findings.push(`Consistent beeld: alle vijf dimensies wijzen naar ${dc(majorityDir).name}.`)
  } else {
    const names = divergent.map(d => `${d.short} → ${dc(d.leader).short}`).join(', ')
    let extra = ''
    const meet = divergent.find(d => d.key === 'meetlat')
    if (meet && majorityDir === 'CI' && meet.leader === 'OE')
      extra = ' Signaal: het team belóóft intimiteit maar stúúrt op efficiëntie.'
    findings.push(
      `Interne spanning: de meeste dimensies leiden naar ${dc(majorityDir).short}, ` +
      `maar ${names} wijkt af.${extra}`
    )
  }
  findings.push(
    `Spreiding in het team: ${leaderCounts.map(x => `${x.n}× ${dc(x.k).short}`).join(', ')} ` +
    `als leidende discipline. ${alignLabel} (spreiding ±${Math.round(avgStd)} pt).`
  )

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
    .dash-root{font-family:'Sora',system-ui,-apple-system,sans-serif;background:${NAVY};color:${INK};padding:22px;box-sizing:border-box;border-radius:16px;}
    .dash-root *{box-sizing:border-box;}
    .dash-in{max-width:1180px;margin:0 auto;}
    .row2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
    .card{background:#fff;border-radius:14px;padding:18px;}
    .rtile{cursor:pointer;transition:box-shadow .15s,transform .15s;}
    .rtile:hover{box-shadow:0 0 0 2px ${LIGHTBLUE};}
    .eyebrow{color:#39B2AD;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;}
    .ttl{font-size:15px;font-weight:800;color:${NAVY};margin:0 0 14px;}
    @media (max-width:860px){.row2{grid-template-columns:1fr;}}
    @media (prefers-reduced-motion:reduce){.rtile{transition:none;}}
  `

  return (
    <div className="dash-root">
      <style>{css}</style>
      <div className="dash-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <div className="eyebrow">{eyebrowLabel}</div>
            <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 800, margin: '6px 0 4px', lineHeight: 1.1 }}>
              Teamconsolidatie
            </h1>
            <p style={{ color: LIGHTBLUE, fontSize: 13.5, margin: 0 }}>
              Waar het directieteam samen staat op de drie disciplines — en waar het uiteenloopt.
            </p>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: LIGHTBLUE, background: 'rgba(255,255,255,.08)', padding: '5px 11px', borderRadius: 20 }}>
            {enriched.length} respondent{enriched.length === 1 ? '' : 'en'}
          </span>
        </div>

        <div className="row2" style={{ marginBottom: 16 }}>
          <div className="card">
            <h2 className="ttl">Positie per lid</h2>
            <svg viewBox="0 0 340 300" style={{ width: '100%', height: 'auto' }} role="img" aria-label="Ternaire plot van respondenten">
              <polygon
                points={`${TRI.L + 0.5 * TRI.W},${TRI.T} ${TRI.L},${TRI.T + TRI.H} ${TRI.L + TRI.W},${TRI.T + TRI.H}`}
                fill="#FBFAF8" stroke={LIGHTBLUE} strokeWidth="1.5"
              />
              {[0.25, 0.5, 0.75].map((f, i) => (
                <line key={i}
                  x1={TRI.L + 0.5 * TRI.W * (1 - f)} y1={TRI.T + TRI.H * f}
                  x2={TRI.L + TRI.W - 0.5 * TRI.W * (1 - f)} y2={TRI.T + TRI.H * f}
                  stroke={LIGHTBLUE} strokeWidth="0.6" strokeDasharray="2 3" opacity="0.7"
                />
              ))}
              <text x={TRI.L + 0.5 * TRI.W} y={TRI.T - 12} textAnchor="middle"
                fontSize="12" fontWeight="700" fill={dc('CI').color} fontFamily="Sora">Customer Intimacy</text>
              <text x={TRI.L - 4} y={TRI.T + TRI.H + 18} textAnchor="start"
                fontSize="12" fontWeight="700" fill={dc('OE').color} fontFamily="Sora">Operational Exc.</text>
              <text x={TRI.L + TRI.W + 4} y={TRI.T + TRI.H + 18} textAnchor="end"
                fontSize="12" fontWeight="700" fill={dc('PL').color} fontFamily="Sora">Product Lead.</text>

              {enriched.map(p => {
                const pt = ternaryXY(p.totals)
                const isSel = selected === p.i
                const isHov = hovered === p.i
                const dim = selected !== null && !isSel
                return (
                  <g key={p.i} style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHovered(p.i)} onMouseLeave={() => setHovered(null)}
                    onClick={() => setSelected(isSel ? null : p.i)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(isSel ? null : p.i) } }}
                    tabIndex={0} role="button" aria-label={`${p.name}, ${dc(p.dom).name}`}>
                    <circle cx={pt.x} cy={pt.y} r={isSel ? 7.5 : 5.5}
                      fill={dc(p.dom).color} stroke="#fff" strokeWidth={isSel ? 2.5 : 1.5}
                      opacity={dim ? 0.32 : 1} />
                    {(isSel || isHov) && (
                      <text x={pt.x} y={pt.y - 11} textAnchor="middle" fontSize="10.5"
                        fontWeight="700" fill={NAVY} fontFamily="Sora">{p.name}</text>
                    )}
                  </g>
                )
              })}
              {(() => {
                const c = ternaryXY(team)
                return (
                  <g>
                    <circle cx={c.x} cy={c.y} r="9" fill="#fff" stroke={NAVY} strokeWidth="2.5" />
                    <circle cx={c.x} cy={c.y} r="3" fill={NAVY} />
                  </g>
                )
              })()}
            </svg>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 11, color: GREY, marginTop: 2 }}>
              <span>● respondent (kleur = leidende discipline)</span>
              <span>◎ team-gemiddelde</span>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 className="ttl">Geconsolideerd profiel</h2>
            {DISCIPLINES.map(d => (
              <div key={d.key} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: d.key === leader.key ? 700 : 500, color: NAVY }}>
                    <span style={{ width: 11, height: 11, borderRadius: 3, background: d.color }} />
                    {d.name}
                    {d.key === leader.key && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: NAVY, background: d.color, padding: '1px 7px', borderRadius: 20 }}>leidend</span>
                    )}
                  </span>
                  <span style={{ fontSize: 19, fontWeight: 800, color: d.color, fontVariantNumeric: 'tabular-nums' }}>{team[d.key]}</span>
                </div>
                <div style={{ height: 11, background: '#EEF1F6', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${team[d.key]}%`, height: '100%', background: d.color, borderRadius: 6 }} />
                </div>
                <div style={{ fontSize: 11, color: GREY, marginTop: 3 }}>
                  spreiding {ranges[d.key].min}–{ranges[d.key].max} over de leden
                </div>
              </div>
            ))}
            <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: `1px solid ${LIGHTBLUE}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12.5, color: INK }}>
                Uitkomst: <strong style={{ color: NAVY }}>{verdict}</strong>.
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: alignColor, background: '#F7F8FA', padding: '4px 10px', borderRadius: 20, border: `1px solid ${LIGHTBLUE}` }}>
                {alignLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="row2" style={{ marginBottom: 16 }}>
          <div className="card">
            <h2 className="ttl">Per lid {selected !== null && <span style={{ fontWeight: 500, color: GREY, fontSize: 12 }}>· klik om te sluiten</span>}</h2>
            {enriched.map(p => {
              const isSel = selected === p.i
              return (
                <div key={p.i} className="rtile"
                  onClick={() => setSelected(isSel ? null : p.i)}
                  onMouseEnter={() => setHovered(p.i)} onMouseLeave={() => setHovered(null)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(isSel ? null : p.i) } }}
                  tabIndex={0} role="button"
                  style={{ padding: '9px 10px', borderRadius: 9, marginBottom: 7, background: isSel ? '#F7F8FA' : 'transparent', border: `1px solid ${isSel ? LIGHTBLUE : 'transparent'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8 }}>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: NAVY }}>{p.name}</span>
                      <span style={{ fontSize: 11.5, color: GREY }}> · {p.role}</span>
                    </span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: NAVY, background: dc(p.dom).color, padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                      {dc(p.dom).short} {p.totals[p.dom as keyof Totals]}
                    </span>
                  </div>
                  <StackBar vals={p.totals} denom={100} h={10} />
                  {isSel && (
                    <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px dashed ${LIGHTBLUE}` }}>
                      {DIMENSIONS.map(d => (
                        <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5 }}>
                          <span style={{ width: 82, fontSize: 10.5, color: GREY }}>{d.short}</span>
                          <div style={{ flex: 1 }}><StackBar vals={p.alloc[d.key]} denom={20} h={7} /></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="card">
            <h2 className="ttl">Per dimensie — waar het profiel vandaan komt</h2>
            {dims.map(d => {
              const diverges = d.leader !== majorityDir
              return (
                <div key={d.key} style={{ marginBottom: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5, gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{d.label}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: diverges ? '#fff' : dc(d.leader).color, background: diverges ? '#CD0039' : 'transparent', padding: diverges ? '2px 8px' : 0, borderRadius: 20, whiteSpace: 'nowrap' }}>
                      {diverges ? '⚠ ' : '→ '}{dc(d.leader).short}
                    </span>
                  </div>
                  <StackBar vals={d.avg} denom={20} h={12} />
                </div>
              )
            })}
            <div style={{ fontSize: 11, color: GREY, lineHeight: 1.45, marginTop: 6, paddingTop: 10, borderTop: `1px solid ${LIGHTBLUE}` }}>
              Een <strong style={{ color: '#CD0039' }}>⚠</strong> markeert een dimensie die een ándere kant op wijst dan de rest — precies waar de directie een gesprek moet voeren.
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <h2 className="ttl">Spreiding per discipline</h2>
          {DISCIPLINES.map(d => {
            const r = ranges[d.key]
            return (
              <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 11 }}>
                <span style={{ width: 148, fontSize: 12.5, fontWeight: 600, color: NAVY, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />{d.name}
                </span>
                <div style={{ flex: 1, position: 'relative', height: 16 }}>
                  <div style={{ position: 'absolute', top: 6, left: 0, right: 0, height: 4, background: '#EEF1F6', borderRadius: 3 }} />
                  <div style={{ position: 'absolute', top: 6, left: `${r.min}%`, width: `${r.max - r.min}%`, height: 4, background: d.color, opacity: 0.35, borderRadius: 3 }} />
                  <div style={{ position: 'absolute', top: 2, left: `calc(${r.avg}% - 6px)`, width: 12, height: 12, borderRadius: '50%', background: d.color, border: '2px solid #fff', boxShadow: '0 1px 2px rgba(0,0,0,.25)' }} title={`gemiddelde ${r.avg}`} />
                </div>
                <span style={{ width: 78, textAlign: 'right', fontSize: 12, color: GREY, fontVariantNumeric: 'tabular-nums' }}>
                  {r.min}–{r.max}
                </span>
              </div>
            )
          })}
          <div style={{ fontSize: 11, color: GREY, marginTop: 4 }}>
            Bol = teamgemiddelde · balk = laagste tot hoogste individuele score. Brede balk = weinig consensus.
          </div>
        </div>

        <div className="card" style={{ background: SIDE, color: OFFWHITE }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Wat dit zegt</div>
          {findings.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 11, marginBottom: i < findings.length - 1 ? 11 : 0 }}>
              <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,.1)', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
              <span style={{ fontSize: 13, lineHeight: 1.5, color: '#EAF0F7' }}>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
