# 꽃줍 (KkotJup)

화훼 도매시장 마감 1시간 전, AI 기반 **떨이 꽃 구출** 타임어택 플랫폼 MVP입니다.

사진 1장 + 음성 10초로 상품 카드를 자동 생성하고, 소비자와 픽업 매칭합니다.

## 빠른 시작

```bash
npm install
cp .env.example .env.local
# .env.local 에 키 입력 (아래 참고)
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)  
상태 확인: [http://localhost:3000/api/health](http://localhost:3000/api/health)

| 환경변수 | 없으면 |
|----------|--------|
| `GEMINI_API_KEY` | AI 분석 → 데모(목) 모드 |
| Supabase URL/KEY | 상품 저장 → 로컬 메모리 (재시작 시 초기화, 기기 간 비공유) |

## Supabase 연결 (배포·다인 공유용)

자세한 단계: [`supabase/README.md`](./supabase/README.md)

1. Supabase 프로젝트 생성  
2. `supabase/schema.sql` 을 SQL Editor에서 실행  
3. `.env.local`에 URL / anon / service_role 키 입력  
4. `npm run dev` 재시작 → `/api/health` 에서 `"storage":"supabase"` 확인  

데이터 모델:

- `products` — 떨이 상품 (구성 JSON, 가격, 남은 수량, 이미지 URL)
- `reservations` — 픽업 코드 / 확인
- Storage `product-images` — 상인 업로드 사진
- RPC `reserve_product` / `confirm_pickup` — 수량·예약 원자 처리

## 주요 플로우

### 상인 (`/seller`)
1. 호수/구역/상호 로그인
2. 사진 업로드 → (재업로드 / 길게 눌러 말하기 / 사진만 AI 분석)
3. AI 결과 확인·수정 → **최종 카드 확인** → **업로드**
4. 손님의 4자리 픽업 번호 확인
5. 남은 수량 0이면 소비자 피드에서 자동 숨김

### 소비자 (`/buyer`)
1. 마감 임박순 떨이 피드
2. 상품 카드(구성/색감/개화상태/절약률/관리팁) 확인
3. 픽업 예약 → 4자리 번호 수령

## AI 파이프라인

`POST /api/analyze`

- 입력: 꽃 이미지(+선택 음성/전사문)
- 처리: Gemini Multimodal → Structured JSON
- 키 없음/실패 시: 도메인 목 데이터로 폴백

## 운영 시간 (데모 기준)

양재꽃시장 가정: **평일 11:30–13:00** 카운트다운  
(피드/등록은 데모를 위해 시간 외에도 사용 가능)

## 스택

- Next.js 15 (App Router) + TypeScript + Tailwind CSS 4
- `@google/generative-ai` (Gemini)
- Supabase (Postgres + Storage) — 미설정 시 인메모리 폴백
