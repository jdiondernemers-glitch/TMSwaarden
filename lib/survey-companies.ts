export type CompanyId = 'tms' | 'ellimetal'

/** Treacy discipline dot colors on intro (oe / pl / ki) */
export type SurveyDiscDots = { oe: string; pl: string; ki: string }

export type SurveyPartColors = { A: string; B: string; C: string; D: string }

/** CI / OE / PL slider colors in dimension scoring */
export type SurveyDisciplineColors = { CI: string; OE: string; PL: string }

export type SurveyTheme = {
  partColors: SurveyPartColors
  discDots: SurveyDiscDots
  disciplineColors: SurveyDisciplineColors
  heroAccent: string
  statusSuccess: string
}

export type CompanyConfig = {
  id: CompanyId
  label: string
  logoPath: string
  /** White filter on done screen hero logo */
  logoFilterWhite: string
  surveyTitle: string
  exportPrefix: string
  outputHeader: string
  introHelp: string
  doneHelp: string
  profileTitle: string
  consolidationEyebrow: string
  theme: SurveyTheme
}

const TMS_THEME: SurveyTheme = {
  partColors: { A: '#CD0039', B: '#39B2AD', C: '#092147', D: '#8FAE73' },
  discDots: { oe: '#092147', pl: '#39B2AD', ki: '#CD0039' },
  disciplineColors: { CI: '#B1CF99', OE: '#39B2AD', PL: '#CD0039' },
  heroAccent: '#CD0039',
  statusSuccess: '#39B2AD',
}

/** Colors aligned with ellimetal.com theme (blues + industrial grey) */
const ELLIMETAL_THEME: SurveyTheme = {
  partColors: { A: '#006ab4', B: '#0d95e8', C: '#002e4e', D: '#566072' },
  discDots: { oe: '#002e4e', pl: '#006ab4', ki: '#0d95e8' },
  disciplineColors: { CI: '#0d95e8', OE: '#002e4e', PL: '#006ab4' },
  heroAccent: '#006ab4',
  statusSuccess: '#0d95e8',
}

export const COMPANIES: Record<CompanyId, CompanyConfig> = {
  tms: {
    id: 'tms',
    label: 'TMS',
    logoPath: '/tms-logo.png',
    logoFilterWhite: 'brightness(0) invert(1)',
    surveyTitle: 'Positioneringssurvey',
    exportPrefix: 'TMS-survey',
    outputHeader: 'TMS · Positioneringssurvey — antwoorden',
    introHelp:
      'Leg vóór de werksessie individueel vast waar TMS volgens jou staat en waar we naartoe moeten. Er zijn geen juiste of foute antwoorden — net de verschillen tussen ons maken het gesprek waardevol.',
    doneHelp:
      'Je antwoorden zijn klaar. We bespreken de geaggregeerde resultaten samen binnen StratCom.',
    profileTitle: 'Jouw TMS-profiel',
    consolidationEyebrow: 'TMS · Waardestrategie',
    theme: TMS_THEME,
  },
  ellimetal: {
    id: 'ellimetal',
    label: 'Ellimetal',
    logoPath: '/ellimetal-logo.png',
    logoFilterWhite: 'none',
    surveyTitle: 'Positioneringssurvey',
    exportPrefix: 'Ellimetal-survey',
    outputHeader: 'Ellimetal · Positioneringssurvey — antwoorden',
    introHelp:
      'Leg vóór de werksessie individueel vast waar Ellimetal volgens jou staat en waar we naartoe moeten. Er zijn geen juiste of foute antwoorden — net de verschillen tussen ons maken het gesprek waardevol.',
    doneHelp:
      'Je antwoorden zijn klaar. We bespreken de geaggregeerde resultaten samen in het team.',
    profileTitle: 'Jouw Ellimetal-profiel',
    consolidationEyebrow: 'Ellimetal · Waardestrategie',
    theme: ELLIMETAL_THEME,
  },
}

export const COMPANY_IDS = Object.keys(COMPANIES) as CompanyId[]

export function parseCompanyParam(value: string | null | undefined): CompanyId {
  if (value === 'ellimetal') return 'ellimetal'
  return 'tms'
}

export function companyQuery(company: CompanyId): string {
  return company === 'tms' ? '' : `?company=${company}`
}

export function adminHref(path: string, company: CompanyId): string {
  if (company === 'tms') return path
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}company=${company}`
}
