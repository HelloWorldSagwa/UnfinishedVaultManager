'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Sidebar from '@/components/layout/sidebar'
import type { User } from '@supabase/supabase-js'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDark, setIsDark] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user prefers dark mode
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme')
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDark(savedTheme ? savedTheme === 'dark' : prefersDark)
    }
  }, [])

  useEffect(() => {
    // Update document class for dark mode
    if (typeof document !== 'undefined') {
      if (isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      localStorage.setItem('theme', isDark ? 'dark' : 'light')
    }
  }, [isDark])

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Check if user has admin role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .single()

      if (!profile || (profile as any).role !== 'admin' || (profile as any).status !== 'active') {
        await supabase.auth.signOut()
        router.push('/login')
        return
      }

      setUser(user)
      setLoading(false)
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        if (event === 'SIGNED_OUT' || !session) {
          router.push('/login')
        } else if (event === 'SIGNED_IN' && session.user) {
          setUser(session.user)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-900' : 'bg-gray-50'} flex`}>
      <Sidebar isDark={isDark} toggleTheme={toggleTheme} />
      
      <div className="flex-1 flex flex-col">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}