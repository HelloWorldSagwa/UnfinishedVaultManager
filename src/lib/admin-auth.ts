import { supabase } from '@/lib/supabase/client'
import bcrypt from 'bcryptjs'

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

class AdminAuthService {
  private static instance: AdminAuthService
  private currentSession: AdminSession | null = null

  private constructor() {
    this.loadSession()
  }

  static getInstance(): AdminAuthService {
    if (!AdminAuthService.instance) {
      AdminAuthService.instance = new AdminAuthService()
    }
    return AdminAuthService.instance
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

  // 로그인
  async login(username: string, password: string): Promise<{ success: boolean; message: string; session?: AdminSession }> {
    try {
      // 관리자 계정 조회
      const { data: admin, error: fetchError } = await supabase
        .from('admin_accounts')
        .select('*')
        .or(`username.eq.${username},email.eq.${username}`)
        .eq('is_active', true)
        .single()

      if (fetchError || !admin) {
        return { success: false, message: '계정을 찾을 수 없습니다.' }
      }

      // 비밀번호 확인
      const passwordMatch = await bcrypt.compare(password, admin.password_hash)
      if (!passwordMatch) {
        // 활동 로그 기록
        await this.logActivity(admin.id, 'login_failed', 'admin_accounts', admin.id, {
          reason: 'invalid_password'
        })
        return { success: false, message: '비밀번호가 일치하지 않습니다.' }
      }

      // 세션 토큰 생성
      const token = this.generateToken()
      const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24시간

      // 세션 저장
      const { error: sessionError } = await supabase
        .from('admin_sessions')
        .insert({
          admin_id: admin.id,
          token,
          expires_at,
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent
        })

      if (sessionError) {
        console.error('Session creation failed:', sessionError)
        return { success: false, message: '세션 생성에 실패했습니다.' }
      }

      // 마지막 로그인 시간 업데이트
      await supabase
        .from('admin_accounts')
        .update({ last_login: new Date().toISOString() })
        .eq('id', admin.id)

      // 세션 객체 생성
      const session: AdminSession = {
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions || {},
          is_active: admin.is_active,
          last_login: admin.last_login,
          created_at: admin.created_at,
          updated_at: admin.updated_at
        },
        token,
        expires_at
      }

      // 로컬 스토리지에 저장
      this.currentSession = session
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_session', JSON.stringify(session))
      }

      // 활동 로그 기록
      await this.logActivity(admin.id, 'login_success', 'admin_accounts', admin.id)

      return { success: true, message: '로그인 성공', session }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, message: '로그인 중 오류가 발생했습니다.' }
    }
  }

  // 로그아웃
  async logout(): Promise<void> {
    if (this.currentSession) {
      // 세션 삭제
      await supabase
        .from('admin_sessions')
        .delete()
        .eq('token', this.currentSession.token)

      // 활동 로그 기록
      await this.logActivity(this.currentSession.admin.id, 'logout', 'admin_accounts', this.currentSession.admin.id)
    }

    // 로컬 스토리지 정리
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

    // DB에서 세션 확인
    const { data: session, error } = await supabase
      .from('admin_sessions')
      .select('*')
      .eq('token', this.currentSession.token)
      .single()

    if (error || !session) {
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

  // 활동 로그 기록
  private async logActivity(
    adminId: string,
    action: string,
    resourceType?: string,
    resourceId?: string,
    details?: any
  ): Promise<void> {
    try {
      await supabase
        .from('admin_activity_logs')
        .insert({
          admin_id: adminId,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details,
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent
        })
    } catch (error) {
      console.error('Failed to log activity:', error)
    }
  }

  // 토큰 생성
  private generateToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  // 클라이언트 IP 가져오기
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch {
      return 'unknown'
    }
  }

  // 비밀번호 해시
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
  }

  // 관리자 계정 생성 (super_admin만 가능)
  async createAdmin(
    adminData: {
      username: string
      email: string
      password: string
      role: 'super_admin' | 'admin' | 'moderator' | 'viewer'
    }
  ): Promise<{ success: boolean; message: string }> {
    if (!this.hasPermission('admin_accounts', 'write')) {
      return { success: false, message: '권한이 없습니다.' }
    }

    try {
      const passwordHash = await AdminAuthService.hashPassword(adminData.password)

      // 역할별 기본 권한 설정
      const permissions = this.getDefaultPermissions(adminData.role)

      const { error } = await supabase
        .from('admin_accounts')
        .insert({
          username: adminData.username,
          email: adminData.email,
          password_hash: passwordHash,
          role: adminData.role,
          permissions,
          created_by: this.currentSession?.admin.id
        })

      if (error) {
        return { success: false, message: error.message }
      }

      // 활동 로그 기록
      await this.logActivity(
        this.currentSession!.admin.id,
        'create_admin',
        'admin_accounts',
        undefined,
        { username: adminData.username, role: adminData.role }
      )

      return { success: true, message: '관리자 계정이 생성되었습니다.' }
    } catch (error: any) {
      return { success: false, message: error.message || '계정 생성 실패' }
    }
  }

  // 역할별 기본 권한
  private getDefaultPermissions(role: string): Record<string, string[]> {
    switch (role) {
      case 'super_admin':
        return {
          users: ['read', 'write', 'delete'],
          works: ['read', 'write', 'delete'],
          contributions: ['read', 'write', 'delete'],
          dummy_data: ['create', 'delete'],
          analytics: ['read'],
          admin_accounts: ['read', 'write', 'delete'],
          settings: ['read', 'write']
        }
      case 'admin':
        return {
          users: ['read', 'write'],
          works: ['read', 'write', 'delete'],
          contributions: ['read', 'write', 'delete'],
          dummy_data: ['create'],
          analytics: ['read']
        }
      case 'moderator':
        return {
          works: ['read', 'write'],
          contributions: ['read', 'write'],
          analytics: ['read']
        }
      case 'viewer':
        return {
          users: ['read'],
          works: ['read'],
          contributions: ['read'],
          analytics: ['read']
        }
      default:
        return {}
    }
  }
}

export const adminAuth = AdminAuthService.getInstance()
export default adminAuth