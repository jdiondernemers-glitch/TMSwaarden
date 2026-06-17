import { createClient } from '@/lib/supabase-server'
import AdminNav from './nav'

export const metadata = { title: 'TMS Admin' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Middleware (middleware.ts) handles the redirect to /admin/login for
  // unauthenticated requests. This layout must NOT redirect itself — doing so
  // would wrap /admin/login and cause an infinite redirect loop.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-50">
      {user && <AdminNav userEmail={user.email ?? ''} />}
      <main className={user ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' : ''}>
        {children}
      </main>
    </div>
  )
}
