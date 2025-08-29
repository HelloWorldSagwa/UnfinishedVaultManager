# Vercel 환경 변수 설정 가이드

## 현재 상황
- 앱은 정상 작동하지만 Supabase 연결이 안 되어 모든 데이터가 0으로 표시됨
- 로그인은 하드코딩된 계정으로 작동함

## Vercel에 환경 변수 추가하기

### 1단계: Vercel 대시보드 접속
1. https://vercel.com 로그인
2. 프로젝트 목록에서 `UnfinishedVaultManager` 클릭

### 2단계: Settings 탭으로 이동
1. 상단 메뉴에서 `Settings` 클릭
2. 왼쪽 사이드바에서 `Environment Variables` 클릭

### 3단계: 환경 변수 추가

#### 첫 번째 변수:
- **Key**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: 
```
https://qmmryvzwzzlirvznbexp.supabase.co
```
- **Environment**: Production, Preview, Development 모두 체크
- `Add` 버튼 클릭

#### 두 번째 변수:
- **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: 
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbXJ5dnp3enpsaXJ2em5iZXhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNjc1MjksImV4cCI6MjA2ODc0MzUyOX0.ddbZnPT_Ybudt3ZOfbxjwiyFF9nKARFti57lZmeZpvg
```
- **Environment**: Production, Preview, Development 모두 체크
- `Add` 버튼 클릭

### 4단계: 재배포
1. `Deployments` 탭으로 이동
2. 가장 최근 배포 옆의 `...` 메뉴 클릭
3. `Redeploy` 선택
4. `Use existing Build Cache` 체크 해제
5. `Redeploy` 버튼 클릭

### 5단계: 확인
- 재배포 완료 후 (약 1-2분)
- 사이트 접속하여 데이터가 정상적으로 표시되는지 확인

## 예상 결과
환경 변수 설정 후:
- Dashboard에서 실제 작품 수, 사용자 수, 기여 수가 표시됨
- Works Management에서 실제 작품 목록이 표시됨
- Users Management에서 실제 사용자 목록이 표시됨

## 문제 해결
만약 여전히 데이터가 0으로 표시된다면:
1. 브라우저 캐시 삭제 (Ctrl+Shift+R 또는 Cmd+Shift+R)
2. 시크릿/프라이빗 모드에서 접속
3. Vercel 대시보드에서 환경 변수가 제대로 저장되었는지 확인
4. 재배포가 성공적으로 완료되었는지 확인

## 테스트 계정 (환경 변수 없이도 작동)
- **Super Admin**: superadmin / Admin@2024!
- **Admin**: admin / Admin@2024!
- **Moderator**: moderator / Mod@2024!
- **Viewer**: viewer / View@2024!