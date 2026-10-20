'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { COMPANIES, COMPANY_IDS, parseCompanyParam, type CompanyId } from '@/lib/survey-companies'

export default function CompanySwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const company = parseCompanyParam(params.get('company'))

  function setCompany(next: CompanyId) {
    const search = new URLSearchParams(params.toString())
    if (next === 'tms') search.delete('company')
    else search.set('company', next)
    const qs = search.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="flex items-center gap-1 rounded-xl border border-gray-200 p-0.5 bg-gray-50">
      {COMPANY_IDS.map(id => (
        <button
          key={id}
          type="button"
          onClick={() => setCompany(id)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            company === id
              ? 'bg-[#092147] text-white shadow-sm'
              : 'text-gray-600 hover:bg-white hover:text-gray-900'
          }`}
        >
          {COMPANIES[id].label}
        </button>
      ))}
    </div>
  )
}
