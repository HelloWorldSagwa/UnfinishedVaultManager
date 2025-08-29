#!/usr/bin/env node

/**
 * 초기 관리자 계정 설정 스크립트
 * 사용법: node scripts/setup-admin.js
 */

const bcrypt = require('bcryptjs')
const { createClient } = require('@supabase/supabase-js')
const readline = require('readline')

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qmmryvzwzzlirvznbexp.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Service Role Key 필요

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다.')
  console.log('Service Role Key는 Supabase Dashboard → Settings → API에서 찾을 수 있습니다.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

// 기본 관리자 계정 정보
const defaultAdmins = [
  {
    username: 'superadmin',
    email: 'admin@unfinishedvault.com',
    password: 'Admin@2024!',
    role: 'super_admin',
    description: '최고 관리자 (모든 권한)'
  },
  {
    username: 'admin',
    email: 'admin2@unfinishedvault.com', 
    password: 'Admin@2024!',
    role: 'admin',
    description: '일반 관리자 (사용자/콘텐츠 관리)'
  },
  {
    username: 'moderator',
    email: 'mod@unfinishedvault.com',
    password: 'Mod@2024!',
    role: 'moderator',
    description: '모더레이터 (콘텐츠 관리)'
  },
  {
    username: 'viewer',
    email: 'viewer@unfinishedvault.com',
    password: 'View@2024!',
    role: 'viewer',
    description: '뷰어 (읽기 전용)'
  }
]

// 역할별 기본 권한
function getDefaultPermissions(role) {
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

async function createAdminAccount(adminData) {
  try {
    // 비밀번호 해시
    const passwordHash = await bcrypt.hash(adminData.password, 10)

    // 권한 설정
    const permissions = getDefaultPermissions(adminData.role)

    // 계정 생성
    const { data, error } = await supabase
      .from('admin_accounts')
      .upsert({
        username: adminData.username,
        email: adminData.email,
        password_hash: passwordHash,
        role: adminData.role,
        permissions,
        is_active: true
      }, {
        onConflict: 'username'
      })

    if (error) {
      console.error(`❌ ${adminData.username} 생성 실패:`, error.message)
      return false
    }

    console.log(`✅ ${adminData.username} (${adminData.description}) 계정 생성/업데이트 완료`)
    return true
  } catch (error) {
    console.error(`❌ ${adminData.username} 생성 중 오류:`, error)
    return false
  }
}

async function main() {
  console.log('='.repeat(60))
  console.log('UnfinishedVault 관리자 계정 설정')
  console.log('='.repeat(60))
  console.log()

  // 테이블 존재 확인
  const { error: tableError } = await supabase
    .from('admin_accounts')
    .select('count')
    .limit(1)

  if (tableError) {
    console.error('❌ admin_accounts 테이블이 존재하지 않습니다.')
    console.log('먼저 sql/create_admin_accounts.sql을 Supabase에서 실행하세요.')
    rl.close()
    process.exit(1)
  }

  console.log('다음 기본 관리자 계정을 생성합니다:\n')
  defaultAdmins.forEach(admin => {
    console.log(`  • ${admin.username} - ${admin.description}`)
    console.log(`    이메일: ${admin.email}`)
    console.log(`    비밀번호: ${admin.password}`)
    console.log()
  })

  const proceed = await question('계속하시겠습니까? (y/n): ')
  
  if (proceed.toLowerCase() !== 'y') {
    console.log('취소되었습니다.')
    rl.close()
    return
  }

  console.log('\n계정 생성 중...\n')

  // 모든 계정 생성
  for (const admin of defaultAdmins) {
    await createAdminAccount(admin)
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ 관리자 계정 설정 완료!')
  console.log('='.repeat(60))
  console.log('\n다음 계정으로 로그인할 수 있습니다:')
  console.log()
  console.log('📌 최고 관리자')
  console.log('   아이디: superadmin 또는 admin@unfinishedvault.com')
  console.log('   비밀번호: Admin@2024!')
  console.log()
  console.log('📌 일반 관리자')
  console.log('   아이디: admin 또는 admin2@unfinishedvault.com')
  console.log('   비밀번호: Admin@2024!')
  console.log()
  console.log('⚠️  보안 주의: 프로덕션 환경에서는 반드시 비밀번호를 변경하세요!')
  console.log()

  // 커스텀 계정 생성 옵션
  const createCustom = await question('추가 관리자 계정을 생성하시겠습니까? (y/n): ')
  
  if (createCustom.toLowerCase() === 'y') {
    console.log('\n새 관리자 계정 정보를 입력하세요:')
    
    const username = await question('아이디: ')
    const email = await question('이메일: ')
    const password = await question('비밀번호: ')
    console.log('\n역할 선택:')
    console.log('1. super_admin - 최고 관리자')
    console.log('2. admin - 일반 관리자')
    console.log('3. moderator - 모더레이터')
    console.log('4. viewer - 뷰어')
    const roleChoice = await question('선택 (1-4): ')
    
    const roles = ['super_admin', 'admin', 'moderator', 'viewer']
    const role = roles[parseInt(roleChoice) - 1] || 'viewer'
    
    await createAdminAccount({
      username,
      email,
      password,
      role,
      description: '커스텀 계정'
    })
  }

  rl.close()
}

// 스크립트 실행
main().catch(error => {
  console.error('스크립트 실행 중 오류:', error)
  rl.close()
  process.exit(1)
})