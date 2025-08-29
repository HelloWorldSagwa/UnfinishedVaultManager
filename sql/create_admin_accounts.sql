-- 관리자 계정 테이블 생성
CREATE TABLE IF NOT EXISTS public.admin_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('super_admin', 'admin', 'moderator', 'viewer')),
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.admin_accounts(id),
  metadata JSONB DEFAULT '{}'
);

-- 역할별 권한 정의
COMMENT ON COLUMN public.admin_accounts.role IS '
super_admin: 모든 권한 (관리자 계정 관리, 시스템 설정)
admin: 일반 관리 권한 (사용자/콘텐츠 관리)
moderator: 콘텐츠 관리 권한 (작품/기여 관리)
viewer: 읽기 전용 권한 (통계 조회만 가능)
';

-- 권한 구조 예시
COMMENT ON COLUMN public.admin_accounts.permissions IS '
{
  "users": ["read", "write", "delete"],
  "works": ["read", "write", "delete"],
  "contributions": ["read", "write", "delete"],
  "dummy_data": ["create", "delete"],
  "analytics": ["read"],
  "admin_accounts": ["read", "write", "delete"]
}
';

-- 인덱스 생성
CREATE INDEX idx_admin_accounts_username ON public.admin_accounts(username);
CREATE INDEX idx_admin_accounts_email ON public.admin_accounts(email);
CREATE INDEX idx_admin_accounts_role ON public.admin_accounts(role);
CREATE INDEX idx_admin_accounts_is_active ON public.admin_accounts(is_active);

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_accounts_updated_at
  BEFORE UPDATE ON public.admin_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_updated_at();

-- 관리자 활동 로그 테이블
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES public.admin_accounts(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 활동 로그 인덱스
CREATE INDEX idx_admin_activity_logs_admin_id ON public.admin_activity_logs(admin_id);
CREATE INDEX idx_admin_activity_logs_action ON public.admin_activity_logs(action);
CREATE INDEX idx_admin_activity_logs_created_at ON public.admin_activity_logs(created_at);

-- 관리자 세션 테이블
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES public.admin_accounts(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 세션 인덱스
CREATE INDEX idx_admin_sessions_admin_id ON public.admin_sessions(admin_id);
CREATE INDEX idx_admin_sessions_token ON public.admin_sessions(token);
CREATE INDEX idx_admin_sessions_expires_at ON public.admin_sessions(expires_at);

-- RLS 정책 (보안)
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- 관리자 계정은 super_admin만 관리 가능
CREATE POLICY admin_accounts_policy ON public.admin_accounts
  USING (true)  -- 읽기는 모든 관리자 가능
  WITH CHECK (auth.jwt() ->> 'role' = 'super_admin');  -- 쓰기는 super_admin만

-- 활동 로그는 읽기만 가능
CREATE POLICY admin_activity_logs_policy ON public.admin_activity_logs
  FOR SELECT USING (true);

-- 세션은 본인 것만 접근 가능
CREATE POLICY admin_sessions_policy ON public.admin_sessions
  USING (admin_id = (auth.jwt() ->> 'sub')::UUID);

-- 기본 super_admin 계정 생성 (비밀번호: Admin@2024!)
-- 비밀번호는 bcrypt로 해시됨 (실제 배포 시 변경 필요)
INSERT INTO public.admin_accounts (
  username, 
  email, 
  password_hash, 
  role,
  permissions
) VALUES (
  'superadmin',
  'admin@unfinishedvault.com',
  '$2a$10$X4kv7j5ZcQr6Bh6Lc5xX5uWlCEqx4cjMpj0LmQqGhTYFmZ9wW/3gO', -- Admin@2024!
  'super_admin',
  '{
    "users": ["read", "write", "delete"],
    "works": ["read", "write", "delete"],
    "contributions": ["read", "write", "delete"],
    "dummy_data": ["create", "delete"],
    "analytics": ["read"],
    "admin_accounts": ["read", "write", "delete"],
    "settings": ["read", "write"]
  }'::jsonb
) ON CONFLICT (username) DO NOTHING;

-- 역할별 기본 권한 함수
CREATE OR REPLACE FUNCTION get_default_permissions(user_role TEXT)
RETURNS JSONB AS $$
BEGIN
  CASE user_role
    WHEN 'super_admin' THEN
      RETURN '{
        "users": ["read", "write", "delete"],
        "works": ["read", "write", "delete"],
        "contributions": ["read", "write", "delete"],
        "dummy_data": ["create", "delete"],
        "analytics": ["read"],
        "admin_accounts": ["read", "write", "delete"],
        "settings": ["read", "write"]
      }'::jsonb;
    WHEN 'admin' THEN
      RETURN '{
        "users": ["read", "write"],
        "works": ["read", "write", "delete"],
        "contributions": ["read", "write", "delete"],
        "dummy_data": ["create"],
        "analytics": ["read"]
      }'::jsonb;
    WHEN 'moderator' THEN
      RETURN '{
        "works": ["read", "write"],
        "contributions": ["read", "write"],
        "analytics": ["read"]
      }'::jsonb;
    WHEN 'viewer' THEN
      RETURN '{
        "users": ["read"],
        "works": ["read"],
        "contributions": ["read"],
        "analytics": ["read"]
      }'::jsonb;
    ELSE
      RETURN '{}'::jsonb;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- 관리자 로그인 함수
CREATE OR REPLACE FUNCTION admin_login(
  p_username TEXT,
  p_password TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  admin_id UUID,
  username TEXT,
  email TEXT,
  role TEXT,
  permissions JSONB,
  token TEXT,
  message TEXT
) AS $$
DECLARE
  v_admin RECORD;
  v_session_token TEXT;
BEGIN
  -- 관리자 계정 조회
  SELECT * INTO v_admin
  FROM public.admin_accounts
  WHERE (admin_accounts.username = p_username OR admin_accounts.email = p_username)
    AND is_active = true;

  -- 계정이 없는 경우
  IF v_admin IS NULL THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      NULL::JSONB,
      NULL::TEXT,
      '계정을 찾을 수 없습니다.'::TEXT;
    RETURN;
  END IF;

  -- 비밀번호 확인 (실제로는 bcrypt 비교 필요)
  -- 여기서는 예시로 간단히 처리
  IF NOT (v_admin.password_hash = crypt(p_password, v_admin.password_hash)) THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      NULL::JSONB,
      NULL::TEXT,
      '비밀번호가 일치하지 않습니다.'::TEXT;
    RETURN;
  END IF;

  -- 세션 토큰 생성
  v_session_token := gen_random_uuid()::TEXT;

  -- 세션 저장
  INSERT INTO public.admin_sessions (
    admin_id,
    token,
    expires_at
  ) VALUES (
    v_admin.id,
    v_session_token,
    NOW() + INTERVAL '24 hours'
  );

  -- 마지막 로그인 시간 업데이트
  UPDATE public.admin_accounts
  SET last_login = NOW()
  WHERE id = v_admin.id;

  -- 성공 응답
  RETURN QUERY SELECT 
    true::BOOLEAN,
    v_admin.id,
    v_admin.username,
    v_admin.email,
    v_admin.role,
    v_admin.permissions,
    v_session_token,
    '로그인 성공'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 권한 체크 함수
CREATE OR REPLACE FUNCTION check_admin_permission(
  p_admin_id UUID,
  p_resource TEXT,
  p_action TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_admin RECORD;
  v_permissions JSONB;
BEGIN
  -- 관리자 정보 조회
  SELECT role, permissions INTO v_admin
  FROM public.admin_accounts
  WHERE id = p_admin_id AND is_active = true;

  IF v_admin IS NULL THEN
    RETURN false;
  END IF;

  -- super_admin은 모든 권한
  IF v_admin.role = 'super_admin' THEN
    RETURN true;
  END IF;

  -- 권한 체크
  v_permissions := v_admin.permissions -> p_resource;
  
  IF v_permissions IS NULL THEN
    RETURN false;
  END IF;

  RETURN v_permissions ? p_action;
END;
$$ LANGUAGE plpgsql;