'use client'

import { useMemo } from 'react'
import type { SurveyDisciplineColors } from '@/lib/survey-companies'
import {
  BUDGET,
  DIMENSIONS,
  DISCIPLINES,
  computeLeader,
  type DimGrid,
  type DimKey,
  type DiscKey,
  type SurveyAlloc,
  allInRow,
  resetRow,
  setCellValue,
} from '@/lib/dimension-scoring'

interface Props {
  grid: DimGrid
  profile: SurveyAlloc
  profileTitle?: string
  disciplineColors?: SurveyDisciplineColors
  onGridChange: (grid: DimGrid) => void
}

const FLAG_COLORS = {
  clear: '#B1CF99',
  nuance: '#39B2AD',
  tie: '#CD0039',
  muted: 'var(--lightblue)',
} as const

export default function DimensionAllocInputs({
  grid,
  profile,
  profileTitle = 'Jouw TMS-profiel',
  disciplineColors,
  onGridChange,
}: Props) {
  const disciplines = DISCIPLINES.map(d => ({
    ...d,
    color: disciplineColors?.[d.key as DiscKey] ?? d.color,
  }))
  const leaderInfo = useMemo(() => computeLeader(profile), [profile])

  const handleSetVal = (dimKey: DimKey, discKey: DiscKey, value: number) => {
    onGridChange(setCellValue(grid, dimKey, discKey, value))
  }

  const handleAllIn = (dimKey: DimKey, discKey: DiscKey) => {
    onGridChange(allInRow(grid, dimKey, discKey))
  }

  const handleResetRow = (dimKey: DimKey) => {
    onGridChange(resetRow(grid, dimKey))
  }

  return (
    <div className="dims-layout">
      <div className="dims-main">
        {DIMENSIONS.map((d, i) => {
          const used = grid[d.key].CI + grid[d.key].OE + grid[d.key].PL
          const left = BUDGET - used
          const complete = used === BUDGET

          return (
            <div key={d.key} className="dim-card">
              <div className="dim-card-head">
                <div className="dim-card-title">
                  <span className="dim-num">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="dim-label">{d.label}</h3>
                </div>
                <span className={`dim-remain${complete ? ' complete' : ''}`}>
                  {complete ? '\u2713 verdeeld' : `nog ${left}`}
                </span>
              </div>
              <p className="dim-help">{d.help}</p>

              {disciplines.map((di, stmtIdx) => {
                const val = grid[d.key][di.key]
                const pct = (val / BUDGET) * 100
                return (
                  <div key={di.key} className="dim-row">
                    <p className="dim-stmt">{d.s[di.key]}</p>
                    <div className="dim-slider-wrap">
                      <input
                        type="range"
                        className="dim-slider"
                        min={0}
                        max={BUDGET}
                        step={1}
                        value={val}
                        onChange={e => handleSetVal(d.key, di.key, Number(e.target.value))}
                        style={{
                          ['--disc-color' as string]: di.color,
                          background: `linear-gradient(to right, ${di.color} ${pct}%, var(--lightblue) ${pct}%)`,
                        }}
                        aria-label={`${d.label} — uitspraak ${stmtIdx + 1}`}
                      />
                      <span
                        className="dim-val"
                        style={{ color: val > 0 ? di.color : undefined }}
                      >
                        {val}
                      </span>
                      <button
                        type="button"
                        className="dim-allin"
                        onClick={() => handleAllIn(d.key, di.key)}
                        title="Alle 20 punten hier"
                      >
                        alles
                      </button>
                    </div>
                  </div>
                )
              })}

              <button
                type="button"
                className="dim-reset"
                onClick={() => handleResetRow(d.key)}
              >
                rij wissen
              </button>
            </div>
          )
        })}
      </div>

      <aside className="dims-profile" aria-live="polite">
        <div className="dims-profile-inner">
          <div className="dims-profile-head">
            <span className="dims-profile-title">{profileTitle}</span>
            <span className={`dims-profile-total${leaderInfo.total === 100 ? ' ok' : ''}`}>
              {leaderInfo.total}/100
            </span>
          </div>

          {disciplines.map(di => {
            const score =
              di.key === 'CI' ? profile.ki : di.key === 'OE' ? profile.oe : profile.pl
            const isLeader = leaderInfo.total >= 100 && di.key === leaderInfo.leader.key
            return (
              <div key={di.key} className="dims-disc">
                <div className="dims-disc-head">
                  <div className="dims-disc-label">
                    <span className="dims-disc-dot" style={{ background: di.color }} />
                    <span className={isLeader ? 'dims-disc-name lead' : 'dims-disc-name'}>
                      {di.name}
                    </span>
                    {isLeader && <span className="dims-lead-badge">leidend</span>}
                  </div>
                  <span className="dims-disc-score" style={{ color: di.color }}>
                    {score}
                  </span>
                </div>
                <div className="dims-disc-bar">
                  <div
                    className="dims-disc-fill"
                    style={{ width: `${score}%`, background: di.color }}
                  />
                </div>
              </div>
            )
          })}

          <p
            className="dims-flag"
            style={{ color: FLAG_COLORS[leaderInfo.flagTone] }}
          >
            {leaderInfo.flagText}
          </p>

          <div className="dims-breakdown">
            <div className="dims-breakdown-title">Waar komt dit vandaan</div>
            {DIMENSIONS.map(d => (
              <div key={d.key} className="dims-breakdown-row">
                <span className="dims-breakdown-short">{d.short}</span>
                <div className="dims-breakdown-bar">
                  {disciplines.map(di => (
                    <div
                      key={di.key}
                      className="dims-breakdown-seg"
                      style={{
                        width: `${(grid[d.key][di.key] / BUDGET) * 100}%`,
                        background: di.color,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="dims-profile-note">
            Wijzen dimensies naar verschillende disciplines? Dat legt een interne spanning bloot
            — precies wat we willen zien.
          </p>
        </div>
      </aside>
    </div>
  )
}
