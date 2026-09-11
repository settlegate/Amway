# Amway ABO 웰니스 AI - 프로젝트 규칙

## 프로젝트 개요

- **목표**: 암웨이 ABO(정주희)가 운영하는 웰니스 AI 비즈니스 & 웰니스 컨설턴트
- **핵심 채널**: 카카오톡 채널 챗봇 + React 웹뷰 Mini-App
- **백엔드**: Node.js + Express + TypeScript
- **AI 엔진**: OpenAI API (GPT-4o / text-embedding-3)
- **데이터베이스**: 개발 시 SQLite, 운영 시 PostgreSQL (Prisma ORM)
- **벡터 DB**: Pinecone 또는 Chroma (RAG용)
- **메시징**: 카카오 비즈메시지 API (알림톡/친구톡)

## 빠른 시작

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
Copy-Item .env.example .env
# .env 에 OPENAI_API_KEY, KAKAO_CHANNEL_TOKEN, PINECONE_API_KEY 등을 입력

# 3. DB 마이그레이션 및 Prisma 클라이언트 생성
npm run db:setup

# 4. 개발 서버 실행 (백엔드 3001, 프론트엔드 5173)
npm run dev
```

## 주요 스크립트

| 스크립트 | 설명 |
|----------|------|
| `npm run dev` | 백엔드 + 프론트엔드 동시 개발 서버 실행 |
| `npm run build` | 백엔드 TypeScript 빌드 + 프론트엔드 Vite 빌드 |
| `npm run start` | 백엔드 프로덕션 서버 실행 |
| `npm run db:setup` | Prisma client 생성 + DB 마이그레이션 |
| `npm run db:studio` | Prisma Studio 실행 |

## 폴더 구조

```
.
├── backend/          # Express API 서버
│   ├── src/
│   │   ├── index.ts         # 서버 진입점
│   │   ├── routes/          # API 엔드포인트
│   │   └── lib/             # AI, DB, 카카오, Cron 등 유틸
│   └── prisma/schema.prisma # 데이터 모델
├── frontend/         # React + Vite 웹뷰 Mini-App
│   └── src/
│       ├── App.tsx
│       └── pages/           # 채팅, 체성분, 제품, 세미나, 관리자
├── docs/             # 기능명세서 등 문서
└── docker-compose.yml # PostgreSQL + Chroma (선택)
```

## 개발 규칙

- **TypeScript**만 사용합니다.
- **`.env.example`**를 참고해 `.env`를 작성하고, 실제 비밀값은 절대 커밋하지 않습니다.
- **pre-commit hook**: `npm install` 시 `.git/hooks/pre-commit`이 설치됩니다. `.env`, `.env.local`, `*.db`, `*.db-journal` 파일을 실수로 커밋하면 자동으로 차단됩니다.
- **개인정보(체성분, 전화번호 등)는 AES-256 암호화 후 저장**합니다.
- **질병 치료/예방, 월소득 확정 등 과대광고 문구**는 AI 응답에서 필터링합니다.
- **식약처 승인 기능성 문구**만 사용하고, 암웨이 공식 라벨/가이드라인 내에서 답변합니다.

## Git / 커밋·푸시 규칙

- **커밋(commit)과 푸시(push)는 정주희 ABO(사용자)의 명시적 승인을 받은 후에만 진행합니다.**
- 변경사항을 commit 하거나 push 하기 전, 반드시 "커밋/푸시해도 될까요?" 또는 동등한 승인을 구해야 합니다.
- 승인 없이 `git commit`, `git push`, `gh pr create`, `gh pr merge` 등 git remote에 영향을 주는 명령을 실행해서는 안 됩니다.
- 비밀값, API 키, 개인정보가 포함된 파일이 staging area에 있는지 다시 한번 확인하고, pre-commit hook 경고가 있으면 즉시 중단합니다.

- **체크아웃, git restore 등 변경 이력을 되돌리는 작업은 사전 승인을 받아야 합니다.**

## 외부 서비스 연동

- **OpenAI API**: `OPENAI_API_KEY` 필요 (채팅/체성분 OCR/뉴스레터/임베딩)
- **카카오 비즈메시지**: `KAKAO_CHANNEL_TOKEN`, `KAKAO_API_KEY` 필요 (알림톡/친구톡)
- **Pinecone/Chroma**: `PINECONE_API_KEY`, `PINECONE_INDEX` 또는 `CHROMA_URL` 필요 (RAG 벡터 검색)
- **a-clic 구매 링크**: `A_CLIC_SPONSOR_ID` 필요 (암웨이 후원자 번호)
- **개인정보 암호화**: `ENCRYPTION_KEY` 필요 (AES-256 64자 hex)
- **Docker 사용 시**: `docker-compose up -d db chroma` 로 PostgreSQL과 Chroma 실행 가능

## 프론트엔드 페이지 구성 규칙

- 모든 새로운 페이지에는 App.tsx 라우트에 등록할 때 Footer를 포함해야 합니다.
- 단독으로 끝나는 페이지(�엔드엔드페이지)를 만들지 않습니다.
- 각 페이지 하단에는 홈, 건강 상담, 제품, 세미나, 사업 등 주요 경로로 이동할 수 있는 공통 푸터 내비게이션을 제공합니다.
