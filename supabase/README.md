# Supabase 연결 가이드 (꽃줍)

## 1. 프로젝트 만들기

1. [https://supabase.com](https://supabase.com) 가입/로그인
2. **New project** 생성 (리전: Northeast Asia / Seoul 권장)
3. DB 비밀번호 저장

## 2. 스키마 실행

1. Dashboard → **SQL Editor** → New query
2. 이 폴더의 `schema.sql` 전체 복사 → 실행 (Run)
3. **이미 schema.sql을 예전에 실행했다면** 아래도 순서대로 추가 실행
   - `migration_auth.sql` (sellers / buyer_nickname)
   - `migration_pickup_hours.sql` (상품 픽업번호 공유)
4. Table Editor에 `products`, `reservations`, `sellers` 보이면 성공
5. Storage에 `product-images` 버킷이 생겼는지 확인

## 3. 환경변수

프로젝트 루트 `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_API_KEY=...
```

키 위치: Dashboard → **Settings → API**

- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- `anon` `public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (서버 전용)

## 4. 확인

```bash
npm run dev
```

브라우저에서 `http://localhost:3000/api/health`  
→ `"storage":"supabase"` 이면 연결 완료.

상인이 상품 올리면 Supabase Table Editor `products`에 행이 생기고,  
사진은 Storage `product-images`에 저장됩니다.

## 테이블 요약

| 테이블 | 역할 |
|--------|------|
| `products` | 떨이 상품 카드 (구성 JSON, 가격, 남은 수량, 이미지 URL) |
| `reservations` | 픽업 4자리 코드 / 확인 상태 |

| RPC | 역할 |
|-----|------|
| `reserve_product(uuid)` | 수량 원자적 감소 + 예약 코드 발급 |
| `confirm_pickup(uuid, text)` | 상인 픽업 확인 |

## 주의

- 현재 RLS는 해커톤 데모용으로 insert/update를 넓게 열어 두었습니다.
- 실제 서비스 전에는 Auth + 상인별 정책으로 강화하세요.
- `service_role` 키는 GitHub에 올리지 마세요 (`.gitignore`에 `.env*` 포함됨).
