# 꽃줍 (KkotJup)

화훼 도매시장 마감 1시간 전, AI 기반 **떨이 꽃 구출** 타임어택 플랫폼 MVP입니다.

사진 1장 + 짧은 음성으로 상품 카드를 자동 생성하고, 인근 소비자와 픽업 매칭합니다.

## 빠른 시작

```bash
npm install
cp .env.example .env.local
# .env.local 에 GEMINI_API_KEY 입력 (없으면 데모/목 분석으로 동작)
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)

## 주요 플로우

### 상인 (`/seller`)
1. 호수/구역/상호 로그인
2. 카메라에서 **길게 누르며** 가격 말하기 (최대 10초)
3. AI가 상품 요약 생성 → **올리기**
4. 손님의 4자리 픽업 번호 확인

### 소비자 (`/buyer`)
1. 마감 임박순 떨이 피드
2. AI 분석 카드(구성/색감/개화상태/절약률/관리팁) 확인
3. 픽업 예약 → 4자리 번호 수령

## AI 파이프라인

`POST /api/analyze`

- 입력: 꽃 이미지(+선택 음성/전사문)
- 처리: Gemini Multimodal → Structured JSON
- 키 없음/실패 시: 도메인 목 데이터로 폴백 (해커톤 시연용)

## 운영 시간 (데모 기준)

양재꽃시장 가정: **평일 11:30–13:00** 카운트다운 표시  
(피드/등록은 데모를 위해 시간 외에도 사용 가능)

## 스택

- Next.js 15 (App Router) + TypeScript + Tailwind CSS 4
- `@google/generative-ai` (Gemini)
- 인메모리 상품 스토어 (로컬 데모)
