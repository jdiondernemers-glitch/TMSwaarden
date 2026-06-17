'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const MONO_R = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNjggNDYiPjxyZWN0IHdpZHRoPSIzMiIgaGVpZ2h0PSI0NiIgcng9IjMiIGZpbGw9IiMwOTIxNDciLz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMzIiIGhlaWdodD0iMTAiIHJ4PSIzIiBmaWxsPSIjMDkyMTQ3Ii8+PHJlY3QgeD0iMTEiIHk9IjAiIHdpZHRoPSIxMCIgaGVpZ2h0PSI0NiIgcng9IjAiIGZpbGw9IiMwOTIxNDciLz48cmVjdCB4PSI0MCIgeT0iMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjQ2IiByeD0iMCIgZmlsbD0iIzA5MjE0NyIvPjxyZWN0IHg9IjQwIiB5PSIwIiB3aWR0aD0iNDYiIGhlaWdodD0iMTAiIHJ4PSIwIiBmaWxsPSIjMDkyMTQ3Ii8+PHBvbHlnb24gcG9pbnRzPSI0MCwwIDUwLDAgNzQsMjMgOTgsMCAxMDgsMCAxMDgsNDYgOTgsNDYgOTgsMTggNzQsNDAgNTAsMTggNTAsNDYgNDAsNDYiIGZpbGw9IiMwOTIxNDciLz48cmVjdCB4PSIxMTgiIHk9IjAiIHdpZHRoPSI1MCIgaGVpZ2h0PSIxMCIgcng9IjAiIGZpbGw9IiMwOTIxNDciLz48cmVjdCB4PSIxMTgiIHk9IjAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIyOCIgcng9IjAiIGZpbGw9IiMwOTIxNDciLz48cmVjdCB4PSIxMTgiIHk9IjE4IiB3aWR0aD0iNTAiIGhlaWdodD0iMTAiIHJ4PSIwIiBmaWxsPSIjMDkyMTQ3Ii8+PHJlY3QgeD0iMTU4IiB5PSIxOCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjI4IiByeD0iMCIgZmlsbD0iIzA5MjE0NyIvPjxyZWN0IHg9IjExOCIgeT0iMzYiIHdpZHRoPSI1MCIgaGVpZ2h0PSIxMCIgcng9IjAiIGZpbGw9IiMwOTIxNDciLz48L3N2Zz4='

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Onjuiste e-mail of wachtwoord.')
      setLoading(false)
    } else {
      router.push('/admin/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <img src={MONO_R} alt="TMS" className="h-6 mb-8" />
        <h1 className="text-2xl font-bold text-[#092147] mb-1">Admin dashboard</h1>
        <p className="text-gray-500 text-sm mb-8">Log in om verder te gaan.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#092147]/20 focus:border-[#092147] transition-colors"
              placeholder="jouw@email.be"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Wachtwoord</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#092147]/20 focus:border-[#092147] transition-colors"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#092147] text-white rounded-xl text-sm font-semibold hover:bg-[#0d2d5e] disabled:opacity-50 transition-colors mt-2"
          >
            {loading ? 'Laden…' : 'Inloggen'}
          </button>
        </form>
      </div>
    </div>
  )
}
