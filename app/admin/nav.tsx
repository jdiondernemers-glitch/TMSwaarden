'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const MONO_R = '/tms-logo.png'

export default function AdminNav({ userEmail }: { userEmail: string }) {
  const path = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  const linkClass = (href: string) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      path.startsWith(href)
        ? 'bg-[#092147] text-white'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <img src={MONO_R} alt="TMS" className="h-6" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Admin</span>
            <div className="flex gap-1">
              <Link href="/admin/dashboard" className={linkClass('/admin/dashboard')}>
                Antwoorden
              </Link>
              <Link href="/admin/questions" className={linkClass('/admin/questions')}>
                Vragen
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:block">{userEmail}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Uitloggen
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
