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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Login attempt:', { username, password })
    setLoading(true)
    setError('')

    try {
      console.log('Calling adminAuth.login...')
      const result = await adminAuth.login(username, password)
      console.log('Login result:', result)

      if (!result.success) {
        setError(result.message)
        return
      }

      // 로그인 성공
      router.push('/dashboard')
    } catch (err: any) {
      setError('로그인 중 오류가 발생했습니다.')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  // 기본 계정 정보 (개발용)
  const defaultAccounts = [
    { role: '최고 관리자', username: 'superadmin', password: 'Admin@2024!', badge: 'bg-red-500' },
    { role: '일반 관리자', username: 'admin', password: 'Admin@2024!', badge: 'bg-blue-500' },
    { role: '모더레이터', username: 'moderator', password: 'Mod@2024!', badge: 'bg-green-500' },
    { role: '뷰어', username: 'viewer', password: 'View@2024!', badge: 'bg-gray-500' },
  ]

  const fillCredentials = (username: string, password: string) => {
    setUsername(username)
    setPassword(password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">UnfinishedVault</h1>
            <p className="text-gray-400">관리자 대시보드</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                아이디 또는 이메일
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="아이디 또는 이메일 입력"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="비밀번호 입력"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  로그인
                </>
              )}
            </button>
          </form>

          {/* 개발용 테스트 계정 정보 */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={() => setShowDefaultAccounts(!showDefaultAccounts)}
              className="flex items-center text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              <Info className="mr-1 h-4 w-4" />
              테스트 계정 정보
            </button>

            {showDefaultAccounts && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-500 mb-3">
                  아래 계정을 클릭하면 자동으로 입력됩니다
                </p>
                {defaultAccounts.map((account) => (
                  <button
                    key={account.username}
                    type="button"
                    onClick={() => fillCredentials(account.username, account.password)}
                    className="w-full text-left p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-block px-2 py-1 text-xs font-medium text-white rounded ${account.badge}`}>
                          {account.role}
                        </span>
                        <div>
                          <p className="text-sm text-gray-300 font-medium">
                            {account.username}
                          </p>
                          <p className="text-xs text-gray-500">
                            {account.password}
                          </p>
                        </div>
                      </div>
                      <span className="text-gray-500 group-hover:text-gray-300 text-xs">
                        클릭
                      </span>
                    </div>
                  </button>
                ))}
                <div className="mt-3 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
                  <p className="text-xs text-yellow-400">
                    ⚠️ 프로덕션 환경에서는 반드시 비밀번호를 변경하세요!
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              초기 설정이 필요한 경우 <br />
              <code className="text-yellow-400">node scripts/setup-admin.js</code> 실행
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}