'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import adminAuth from '@/lib/admin-auth-simple'
import Sidebar from '@/components/layout/sidebar'
import type { AdminAccount } from '@/lib/admin-auth-simple'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<AdminAccount | null>(null)
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
      // 세션 확인
      const isValid = await adminAuth.validateSession()
      
      if (!isValid) {
        router.push('/login')
        return
      }

      // 현재 관리자 정보 가져오기
      const admin = adminAuth.getCurrentAdmin()
      if (!admin) {
        router.push('/login')
        return
      }

      setUser(admin)
      setLoading(false)
    }

    checkUser()
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