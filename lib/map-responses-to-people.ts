import {
  BUDGET,
  DIMENSIONS,
  type DimAlloc,
  type DimGrid,
  type DimKey,
  type DiscKey,
} from '@/lib/dimension-scoring'
import type { AllocSource, MapResult, Person, SurveyResponseRow } from '@/lib/consolidation-types'

const DISC_KEYS: DiscKey[] = ['CI', 'OE', 'PL']
const DIM_KEYS = DIMENSIONS.map(d => d.key)

function splitNameRole(naam: string | null | undefined): { name: string; role: string } {
  const raw = (naam ?? '').trim()
  if (!raw) return { name: 'Anoniem', role: '—' }
  const parts = raw.split(' · ')
  if (parts.length >= 2) {
    return { name: parts[0].trim(), role: parts.slice(1).join(' · ').trim() || '—' }
  }
  return { name: raw, role: '—' }
}

function isDimAlloc(v: unknown): v is DimAlloc {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return DISC_KEYS.every(k => typeof o[k] === 'number' && o[k] >= 0)
}

function isCompleteGrid(v: unknown): v is DimGrid {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  for (const dim of DIM_KEYS) {
    const row = o[dim]
    if (!isDimAlloc(row)) return false
    const sum = DISC_KEYS.reduce((s, k) => s + row[k], 0)
    if (sum !== BUDGET) return false
  }
  return true
}

function parseGrid(answers: Record<string, unknown>, source: AllocSource): DimGrid | null {
  const raw = answers[`${source}_dims`]
  return isCompleteGrid(raw) ? raw : null
}

export function mapResponsesToPeople(
  rows: SurveyResponseRow[],
  source: AllocSource
): MapResult {
  const people: Person[] = []
  let skipped = 0

  for (const row of rows) {
    const grid = parseGrid(row.answers, source)
    if (!grid) {
      skipped++
      continue
    }
    const { name, role } = splitNameRole(
      row.naam ?? (typeof row.answers.naam === 'string' ? row.answers.naam : null)
    )
    people.push({ name, role, alloc: grid })
  }

  return { people, skipped }
}
