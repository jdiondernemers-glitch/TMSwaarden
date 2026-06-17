'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const MONO_R = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNjggNDYiPjxyZWN0IHdpZHRoPSIzMiIgaGVpZ2h0PSI0NiIgcng9IjMiIGZpbGw9IiMwOTIxNDciLz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMzIiIGhlaWdodD0iMTAiIHJ4PSIzIiBmaWxsPSIjMDkyMTQ3Ii8+PHJlY3QgeD0iMTEiIHk9IjAiIHdpZHRoPSIxMCIgaGVpZ2h0PSI0NiIgcng9IjAiIGZpbGw9IiMwOTIxNDciLz48cmVjdCB4PSI0MCIgeT0iMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjQ2IiByeD0iMCIgZmlsbD0iIzA5MjE0NyIvPjxyZWN0IHg9IjQwIiB5PSIwIiB3aWR0aD0iNDYiIGhlaWdodD0iMTAiIHJ4PSIwIiBmaWxsPSIjMDkyMTQ3Ii8+PHBvbHlnb24gcG9pbnRzPSI0MCwwIDUwLDAgNzQsMjMgOTgsMCAxMDgsMCAxMDgsNDYgOTgsNDYgOTgsMTggNzQsNDAgNTAsMTggNTAsNDYgNDAsNDYiIGZpbGw9IiMwOTIxNDciLz48cmVjdCB4PSIxMTgiIHk9IjAiIHdpZHRoPSI1MCIgaGVpZ2h0PSIxMCIgcng9IjAiIGZpbGw9IiMwOTIxNDciLz48cmVjdCB4PSIxMTgiIHk9IjAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIyOCIgcng9IjAiIGZpbGw9IiMwOTIxNDciLz48cmVjdCB4PSIxMTgiIHk9IjE4IiB3aWR0aD0iNTAiIGhlaWdodD0iMTAiIHJ4PSIwIiBmaWxsPSIjMDkyMTQ3Ii8+PHJlY3QgeD0iMTU4IiB5PSIxOCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjI4IiByeD0iMCIgZmlsbD0iIzA5MjE0NyIvPjxyZWN0IHg9IjExOCIgeT0iMzYiIHdpZHRoPSI1MCIgaGVpZ2h0PSIxMCIgcng9IjAiIGZpbGw9IiMwOTIxNDciLz48L3N2Zz4='

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
