// Five-dimension constant-sum scoring → survey { oe, pl, ki } profile

export const BUDGET = 20

export type DiscKey = 'CI' | 'OE' | 'PL'
export type DimKey = 'belofte' | 'kernproces' | 'cultuur' | 'meetlat' | 'relatie'

export type DimAlloc = Record<DiscKey, number>
export type DimGrid = Record<DimKey, DimAlloc>

export type SurveyAlloc = { oe: number; pl: number; ki: number }

export const DISCIPLINES = [
  { key: 'CI' as const, name: 'Customer Intimacy', color: '#B1CF99' },
  { key: 'OE' as const, name: 'Operational Excellence', color: '#39B2AD' },
  { key: 'PL' as const, name: 'Product Leadership', color: '#CD0039' },
]

export const DIMENSIONS = [
  {
    key: 'belofte' as const,
    label: 'Belofte aan de klant',
    short: 'Belofte',
    help: 'Wat beloven we, en waarom kiezen klanten voor ons?',
    s: {
      CI: 'De beste totaaloplossing voor de specifieke situatie van de klant.',
      OE: 'Betrouwbaar en zonder gedoe, aan de laagste totale kost.',
      PL: 'Het technisch beste en meest geavanceerde aanbod in de markt.',
    },
  },
  {
    key: 'kernproces' as const,
    label: 'Kernproces',
    short: 'Kernproces',
    help: 'Waar zit onze operationele kracht?',
    s: {
      CI: 'In klantkennis, maatwerk en verantwoordelijkheid voor het resultaat.',
      OE: 'In gestandaardiseerde, strak geoptimaliseerde processen.',
      PL: 'In innovatie, nieuwe technieken en snelle toepassing.',
    },
  },
  {
    key: 'cultuur' as const,
    label: 'Organisatie & cultuur',
    short: 'Organisatie',
    help: 'Hoe zijn we intern gebouwd?',
    s: {
      CI: 'Gedecentraliseerd — onze mensen dicht bij de klant beslissen mee.',
      OE: 'Centraal, gedisciplineerd en voorspelbaar; gericht op geen verspilling.',
      PL: 'Los en ondernemend; ruimte om te experimenteren en te leren.',
    },
  },
  {
    key: 'meetlat' as const,
    label: 'Meetlat',
    short: 'Meetlat',
    help: 'Waar sturen we intern op?',
    s: {
      CI: 'Op klanttevredenheid, retentie en klantwaarde over de tijd.',
      OE: 'Op kost, doorlooptijd en first-time-right.',
      PL: 'Op vernieuwing en de voorsprong van ons aanbod.',
    },
  },
  {
    key: 'relatie' as const,
    label: 'Klantrelatie',
    short: 'Klantrelatie',
    help: 'Welk type relatie hebben we met klanten?',
    s: {
      CI: 'Diep en langdurig — een partnership met gedeeld belang.',
      OE: 'Efficiënt en transactioneel; vlot herhaalbaar op schaal.',
      PL: 'Gedreven door ons aanbod en zijn mogelijkheden.',
    },
  },
]

const emptyRow = (): DimAlloc => ({ CI: 0, OE: 0, PL: 0 })

export function emptyGrid(): DimGrid {
  return Object.fromEntries(DIMENSIONS.map(d => [d.key, emptyRow()])) as DimGrid
}

export function rowSum(grid: DimGrid, dimKey: DimKey): number {
  const row = grid[dimKey]
  return row.CI + row.OE + row.PL
}

export function isRowComplete(grid: DimGrid, dimKey: DimKey): boolean {
  return rowSum(grid, dimKey) === BUDGET
}

export function isGridComplete(grid: DimGrid | undefined): boolean {
  if (!grid) return false
  return DIMENSIONS.every(d => isRowComplete(grid, d.key))
}

export function setCellValue(
  grid: DimGrid,
  dimKey: DimKey,
  discKey: DiscKey,
  value: number
): DimGrid {
  const row = { ...grid[dimKey] }
  const otherSum = (['CI', 'OE', 'PL'] as DiscKey[])
    .filter(k => k !== discKey)
    .reduce((s, k) => s + row[k], 0)
  const max = BUDGET - otherSum
  row[discKey] = Math.max(0, Math.min(Math.round(value), max))
  return { ...grid, [dimKey]: row }
}

export function allInRow(grid: DimGrid, dimKey: DimKey, discKey: DiscKey): DimGrid {
  const row = emptyRow()
  row[discKey] = BUDGET
  return { ...grid, [dimKey]: row }
}

export function resetRow(grid: DimGrid, dimKey: DimKey): DimGrid {
  return { ...grid, [dimKey]: emptyRow() }
}

/** Sum dimension allocations → survey storage keys (CI→ki, OE→oe, PL→pl) */
export function aggregateToSurvey(grid: DimGrid): SurveyAlloc {
  const raw = { CI: 0, OE: 0, PL: 0 }
  for (const d of DIMENSIONS) {
    for (const di of DISCIPLINES) {
      raw[di.key] += grid[d.key][di.key]
    }
  }
  return { oe: raw.OE, pl: raw.PL, ki: raw.CI }
}

export type LeaderResult = {
  leader: (typeof DISCIPLINES)[number]
  gap: number
  total: number
  flagText: string
  flagTone: 'muted' | 'clear' | 'nuance' | 'tie'
  scores: SurveyAlloc
}

export function computeLeader(profile: SurveyAlloc): LeaderResult {
  const entries = [
    { ...DISCIPLINES[0], score: profile.ki },
    { ...DISCIPLINES[1], score: profile.oe },
    { ...DISCIPLINES[2], score: profile.pl },
  ].sort((a, b) => b.score - a.score)

  const total = profile.ki + profile.oe + profile.pl
  const leader = entries[0]
  const gap = entries[0].score - entries[1].score

  let flagText: string
  let flagTone: LeaderResult['flagTone']
  if (total < 100) {
    flagText = `Nog ${100 - total} punten te verdelen`
    flagTone = 'muted'
  } else if (gap >= 15) {
    flagText = 'Duidelijke leidende discipline'
    flagTone = 'clear'
  } else if (gap >= 6) {
    flagText = 'Leidend, met nuance'
    flagTone = 'nuance'
  } else {
    flagText = 'Geen duidelijke keuze — dit is zelf een bespreekpunt'
    flagTone = 'tie'
  }

  return { leader, gap, total, flagText, flagTone, scores: profile }
}
