// 간단한 관리자 인증 시스템 (클라이언트 사이드용)
// 주의: 실제 프로덕션에서는 서버 사이드 인증을 사용해야 합니다

export interface AdminAccount {
  id: string
  username: string
  email: string
  role: 'super_admin' | 'admin' | 'moderator' | 'viewer'
  permissions: Record<string, string[]>
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

export interface AdminSession {
  admin: AdminAccount
  token: string
  expires_at: string
}

// 하드코딩된 기본 계정 (개발용)
const DEFAULT_ACCOUNTS = [
  {
    id: 'super-admin-id',
    username: 'superadmin',
    email: 'admin@unfinishedvault.com',
    password: 'Admin@2024!',
    role: 'super_admin' as const,
    permissions: {
      users: ['read', 'write', 'delete'],
      works: ['read', 'write', 'delete'],
      contributions: ['read', 'write', 'delete'],
      dummy_data: ['create', 'delete'],
      analytics: ['read'],
      admin_accounts: ['read', 'write', 'delete'],
      settings: ['read', 'write']
    }
  },
  {
    id: 'admin-id',
    username: 'admin',
    email: 'admin2@unfinishedvault.com',
    password: 'Admin@2024!',
    role: 'admin' as const,
    permissions: {
      users: ['read', 'write'],
      works: ['read', 'write', 'delete'],
      contributions: ['read', 'write', 'delete'],
      dummy_data: ['create'],
      analytics: ['read'],
      admin_accounts: [],
      settings: []
    } as Record<string, string[]>
  },
  {
    id: 'moderator-id',
    username: 'moderator',
    email: 'mod@unfinishedvault.com',
    password: 'Mod@2024!',
    role: 'moderator' as const,
    permissions: {
      users: [],
      works: ['read', 'write'],
      contributions: ['read', 'write'],
      dummy_data: [],
      analytics: ['read'],
      admin_accounts: [],
      settings: []
    } as Record<string, string[]>
  },
  {
    id: 'viewer-id',
    username: 'viewer',
    email: 'viewer@unfinishedvault.com',
    password: 'View@2024!',
    role: 'viewer' as const,
    permissions: {
      users: ['read'],
      works: ['read'],
      contributions: ['read'],
      dummy_data: [],
      analytics: ['read'],
      admin_accounts: [],
      settings: []
    } as Record<string, string[]>
  }
]

class SimpleAdminAuth {
  private static instance: SimpleAdminAuth
  private currentSession: AdminSession | null = null

  private constructor() {
    this.loadSession()
  }

  static getInstance(): SimpleAdminAuth {
    if (!SimpleAdminAuth.instance) {
      SimpleAdminAuth.instance = new SimpleAdminAuth()
    }
    return SimpleAdminAuth.instance
  }

  // 세션 로드
  private loadSession() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('admin_session')
      if (stored) {
        try {
          const session = JSON.parse(stored) as AdminSession
          // 만료 체크
          if (new Date(session.expires_at) > new Date()) {
            this.currentSession = session
          } else {
            localStorage.removeItem('admin_session')
          }
        } catch (e) {
          console.error('Failed to load admin session:', e)
        }
      }
    }
  }

  // 로그인 (하드코딩된 계정 사용)
  async login(username: string, password: string): Promise<{ success: boolean; message: string; session?: AdminSession }> {
    try {
      // 하드코딩된 계정에서 찾기
      const account = DEFAULT_ACCOUNTS.find(acc => 
        (acc.username === username || acc.email === username) && acc.password === password
      )

      if (!account) {
        return { success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' }
      }

      // 하드코딩된 계정으로 세션 생성
      const session = this.createSession({
        id: account.id,
        username: account.username,
        email: account.email,
        role: account.role,
        permissions: account.permissions,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      return { success: true, message: '로그인 성공', session }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, message: '로그인 중 오류가 발생했습니다.' }
    }
  }

  // 세션 생성
  private createSession(admin: AdminAccount): AdminSession {
    const token = this.generateToken()
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const session: AdminSession = {
      admin,
      token,
      expires_at
    }

    // 로컬 스토리지에 저장
    this.currentSession = session
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_session', JSON.stringify(session))
    }

    return session
  }

  // 로그아웃
  async logout(): Promise<void> {
    this.currentSession = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_session')
    }
  }

  // 세션 검증
  async validateSession(): Promise<boolean> {
    if (!this.currentSession) {
      return false
    }

    // 만료 체크
    if (new Date(this.currentSession.expires_at) <= new Date()) {
      await this.logout()
      return false
    }

    return true
  }

  // 권한 체크
  hasPermission(resource: string, action: string): boolean {
    if (!this.currentSession) {
      return false
    }

    const { admin } = this.currentSession

    // super_admin은 모든 권한
    if (admin.role === 'super_admin') {
      return true
    }

    // 권한 체크
    const resourcePermissions = admin.permissions[resource]
    if (!resourcePermissions) {
      return false
    }

    return resourcePermissions.includes(action)
  }

  // 현재 세션 가져오기
  getSession(): AdminSession | null {
    return this.currentSession
  }

  // 현재 관리자 가져오기
  getCurrentAdmin(): AdminAccount | null {
    return this.currentSession?.admin || null
  }

  // 토큰 생성
  private generateToken(): string {
    return Math.random().toString(36).substr(2) + Date.now().toString(36)
  }
}

export const adminAuth = SimpleAdminAuth.getInstance()
export default adminAuth