'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Home, 
  FileText, 
  Users, 
  Menu, 
  X, 
  LogOut,
  Moon,
  Sun,
  BookOpen,
  PlusCircle
} from 'lucide-react'
import adminAuth from '@/lib/admin-auth-simple'

interface SidebarProps {
  isDark: boolean
  toggleTheme: () => void
}

export default function Sidebar({ isDark, toggleTheme }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Works Management', href: '/dashboard/works', icon: FileText },
    { name: 'Users Management', href: '/dashboard/users', icon: Users },
    { name: 'Manual Input', href: '/dashboard/manual-input', icon: PlusCircle },
  ]

  const handleLogout = async () => {
    await adminAuth.logout()
    router.push('/login')
  }

  return (
    <div className={`
      ${isCollapsed ? 'w-16' : 'w-64'} 
      transition-all duration-300 
      ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} 
      border-r h-screen flex flex-col
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className={`flex items-center space-x-3 ${isCollapsed ? 'hidden' : 'block'}`}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
              UnfinishedVault
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Admin Dashboard
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`
            p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
            ${isDark ? 'text-gray-400' : 'text-gray-600'}
          `}
        >
          {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pb-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-blue-600 text-white' 
                      : isDark 
                        ? 'text-gray-300 hover:bg-gray-800 hover:text-white' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <button
          onClick={toggleTheme}
          className={`
            w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors
            ${isDark 
              ? 'text-gray-300 hover:bg-gray-800 hover:text-white' 
              : 'text-gray-700 hover:bg-gray-100'
            }
          `}
          title={isCollapsed ? 'Toggle Theme' : undefined}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {!isCollapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        
        <button
          onClick={handleLogout}
          className={`
            w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors
            ${isDark 
              ? 'text-red-400 hover:bg-red-900/20' 
              : 'text-red-600 hover:bg-red-50'
            }
          `}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  )
}