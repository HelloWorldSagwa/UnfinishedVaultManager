'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import adminAuth from '@/lib/admin-auth-simple'
import { Eye, EyeOff, LogIn, Info, User, Lock } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showDefaultAccounts, setShowDefaultAccounts] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    console.log('Login button clicked')
    console.log('Login attempt with:', { username, password })
    
    if (!username || !password) {
      setError('Please enter username and password')
      return
    }
    
    setLoading(true)
    setError('')

    try {
      console.log('Calling adminAuth.login...')
      const result = await adminAuth.login(username, password)
      console.log('Login result:', result)

      if (!result.success) {
        console.log('Login failed:', result.message)
        setError(result.message)
        setLoading(false)
        return
      }

      // 로그인 성공
      console.log('Login successful! Session:', result.session)
      console.log('Redirecting to /dashboard...')
      setLoading(false)
      
      // Use a small delay to ensure state updates
      setTimeout(() => {
        console.log('Executing redirect now...')
        window.location.href = '/dashboard'
      }, 100)
    } catch (err: any) {
      console.error('Login error caught:', err)
      setError('로그인 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleLogin()
  }

  // 기본 계정 정보 (개발용)
  const defaultAccounts = [
    { role: 'Super Admin', username: 'superadmin', password: 'Admin@2024!', badge: 'bg-red-500' },
    { role: 'Admin', username: 'admin', password: 'Admin@2024!', badge: 'bg-blue-500' },
    { role: 'Moderator', username: 'moderator', password: 'Mod@2024!', badge: 'bg-green-500' },
    { role: 'Viewer', username: 'viewer', password: 'View@2024!', badge: 'bg-gray-500' },
  ]

  const fillCredentials = (username: string, password: string) => {
    setUsername(username)
    setPassword(password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md mx-8">
        <div className="bg-white/5 backdrop-blur-lg rounded-3xl shadow-2xl p-12 border border-white/10">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-light text-white mb-3 tracking-wide">UnfinishedVault</h1>
            <p className="text-gray-400 text-sm">Admin Dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label htmlFor="username" className="block text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all"
                  placeholder="Enter username or email"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* 개발용 테스트 계정 정보 */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowDefaultAccounts(!showDefaultAccounts)}
              className="flex items-center text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              <Info className="mr-2 h-3 w-3" />
              Test Accounts
            </button>

            {showDefaultAccounts && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-600 mb-3">
                  Click to auto-fill credentials
                </p>
                {defaultAccounts.map((account) => (
                  <button
                    key={account.username}
                    type="button"
                    onClick={() => fillCredentials(account.username, account.password)}
                    className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-block px-2 py-1 text-xs font-medium text-white rounded-md ${account.badge} bg-opacity-80`}>
                          {account.role}
                        </span>
                        <div>
                          <p className="text-sm text-gray-300 font-medium">
                            {account.username}
                          </p>
                          <p className="text-xs text-gray-600">
                            {account.password}
                          </p>
                        </div>
                      </div>
                      <span className="text-gray-600 group-hover:text-gray-400 text-xs">
                        →
                      </span>
                    </div>
                  </button>
                ))}
                <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-xs text-yellow-500">
                    ⚠️ For development only
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}