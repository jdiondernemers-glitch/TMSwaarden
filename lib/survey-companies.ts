export type CompanyId = 'tms' | 'ellimetal'

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
