# Amway ABO 웰니스 AI

정주희 ABO님을 위한 **암웨이 공식 웰니스 AI 비즈니스 & 웰니스 컨설턴트** 작업 환경입니다.

## 핵심 스택

- **채널**: 카카오톡 채널 챗봇 + React 기반 웹뷰 Mini-App
- **백엔드**: Node.js + Express + TypeScript
- **AI 엔진**: OpenAI API (GPT-4o / text-embedding-3)
- **데이터베이스**: SQLite(개발) / PostgreSQL(운영) + Prisma ORM
- **벡터 DB**: Pinecone 또는 Chroma
- **메시징**: 카카오 비즈메시지 API (알림톡/친구톡)
- **배치**: node-cron

## 구현된 기능 (스켈레톤)

| 기능명세서 구분 | 기능 | 엔드포인트 / 페이지 |
|----------------|------|---------------------|
| 마케팅 자동화 | 월간 뉴스레터 | `lib/cron.ts` + `lib/ai.ts` |
| 수신동의 | 동의/철회 관리 | `POST /api/consent/agree`, `POST /api/consent/withdraw` |
| 통합 리드 | CRM 대시보드 | `GET /api/admin/dashboard` + `/admin` |
| 소비자 케어 | 맞춤 건강 상담 | `POST /api/chat` + `/chat` |
| 소비자 케어 | 체성분 OCR 분석 | `POST /api/body/analyze` + `/body` |
| 소비자 케어 | 제품 추천/효능 안내 | `GET /api/products` + `/products` |
| 소비자 케어 | 복용 리마인더 | `POST /api/reminders` + `/reminders` |
| 사업 확장 | 사업 설명(STP) | `GET /api/business/stp` + `/business` |
| 사업 확장 | 세미나 신청 | `GET /api/seminars`, `POST /api/seminars/:id/apply` + `/seminars` |
| 구매/전환 | a-clic 링크 | 제품 카드 버튼 |
| 시스템 안전 | 금지어 필터 | `lib/guard.ts` |
| 시스템 안전 | 개인정보 암호화 | `lib/crypto.ts` (AES-256) |

## 빠른 시작

```powershell
# 1. 환경 변수 복사 (이후 .env에 실제 API 키 입력)
Copy-Item .env.example .env

# 2. 의존성 설치
npm install

# 3. DB 및 Prisma 클라이언트 설정
npm run db:setup

# 4. 개발 서버 실행 (백엔드 3001, 프론트엔드 5173)
npm run dev
```

실행 후 브라우저에서 http://localhost:5173 에 접속하세요.

## 외부 서비스 연동

`.env`에 다음 키들을 입력하면 실제 API 연동이 활성화됩니다.

- `OPENAI_API_KEY` : OpenAI GPT-4o / text-embedding-3
- `KAKAO_CHANNEL_TOKEN`, `KAKAO_API_KEY` : 카카오 비즈메시지
- `PINECONE_API_KEY`, `PINECONE_INDEX` : Pinecone 벡터 DB
- `A_CLIC_SPONSOR_ID` : 암웨이 a-clic 후원자 번호
- `ENCRYPTION_KEY` : AES-256 개인정보 암호화 키 (64자 hex)

키가 없어도 Mock 응답으로 동작합니다.

> **보안**: `npm install` 시 pre-commit hook이 설치되어 `.env`와 `*.db` 파일이 실수로 커밋되는 것을 차단합니다.

## Docker (선택)

PostgreSQL + Chroma를 로컬로 띄우려면:

```powershell
docker-compose up -d db chroma
# .env의 DATABASE_URL을 PostgreSQL 주소로 변경
```

## 프로젝트 문서

- 기능명세서: `docs/spec-v2.0.txt`
- 개발 규칙: `AGENTS.md`
