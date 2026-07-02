import type { DimKey, DiscKey } from '@/lib/dimension-scoring'

export type Alloc = Record<DiscKey, number>

export type PersonAlloc = Record<DimKey, Alloc>

export type Person = {
  name: string
  role: string
  alloc: PersonAlloc
}

export type AllocSource = 'A1' | 'A2'

export type SurveyResponseRow = {
  id: string
  naam: string | null
  mode: string | null
  answers: Record<string, unknown>
  created_at?: string
}

export type MapResult = {
  people: Person[]
  skipped: number
}
