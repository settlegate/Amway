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

## 테스트

백엔드와 프론트엔드 모두 [Vitest](https://vitest.dev)로 테스트하며, 코드 커버리지는 **90% 이상**을 유지합니다.

| 구분 | 환경 | 주요 도구 |
|------|------|-----------|
| backend | Node | Vitest, `@vitest/coverage-v8`, supertest |
| frontend | jsdom | Vitest, `@vitest/coverage-v8`, Testing Library (`react`, `user-event`, `jest-dom`) |

### 사전 준비

```powershell
npm install
```

테스트는 OpenAI, Pinecone, 카카오 API, Prisma(DB), `fetch`를 모두 모킹하므로 **`.env` 파일, DB, 네트워크 연결 없이 실행됩니다.**
로컬 `.env`에 API 키가 있어도 테스트 시작 시 무시되도록 설정되어 있습니다.

### 테스트 실행

루트에서 실행하는 명령:

| 명령 | 설명 |
|------|------|
| `npm test` | 백엔드 → 프론트엔드 순서로 전체 테스트 1회 실행 |
| `npm run test -w backend` | 백엔드 테스트만 실행 |
| `npm run test -w frontend` | 프론트엔드 테스트만 실행 |
| `npm run test:watch -w backend` | 백엔드 watch 모드 (파일 저장 시 관련 테스트 자동 재실행) |
| `npm run test:watch -w frontend` | 프론트엔드 watch 모드 |

특정 파일이나 테스트 이름만 실행하려면 `--` 뒤에 Vitest 옵션을 붙입니다.

```powershell
# 특정 파일만 실행
npm run test -w backend -- tests/lib/ai.test.ts
npm run test -w frontend -- tests/components/ChatPanel.test.tsx

# 경로 일부로 필터링 (routes 폴더의 테스트 전체)
npm run test -w backend -- routes

# 테스트 이름(describe/it 문구)으로 필터링
npm run test -w backend -- -t "금지어"
```

실행 결과 예시:

```
 Test Files  24 passed (24)
      Tests  235 passed (235)
```

하나라도 실패하면 실패한 테스트 이름, 기대값(`Expected`)과 실제값(`Received`)의 차이, 소스 위치가 출력되고 명령은 0이 아닌 종료 코드로 끝납니다.

### 커버리지 확인

```powershell
npm run test:coverage -w backend
npm run test:coverage -w frontend
```

실행하면 세 가지 형식의 리포트가 생성됩니다.

| 형식 | 위치 | 용도 |
|------|------|------|
| text | 터미널 출력 | 전체/파일별 수치를 바로 확인 |
| html | `backend/coverage/index.html`, `frontend/coverage/index.html` | 파일별로 실행되지 않은 줄·분기를 색상으로 확인 |
| lcov | `backend/coverage/lcov.info`, `frontend/coverage/lcov.info` | CI, Codecov, IDE 플러그인 연동 |

#### 터미널 리포트 읽는 법

```
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------|---------|----------|---------|---------|-------------------
All files          |   99.15 |    96.08 |     100 |    99.2 |
  vector.ts        |   94.44 |    83.69 |     100 |   93.54 | 187-194
-------------------|---------|----------|---------|---------|-------------------
```

- **% Stmts**: 실행된 문장(statement) 비율
- **% Branch**: `if`, 삼항 연산자, `&&`, `??` 등 분기의 양쪽 경로가 모두 실행된 비율
- **% Funcs**: 한 번 이상 호출된 함수 비율
- **% Lines**: 실행된 줄 비율
- **Uncovered Line #s**: 테스트가 거치지 않은 줄 번호 (새 테스트를 추가할 위치)

모든 파일이 100%이면 표에서 생략되고, 100%가 아닌 파일만 표시됩니다.

#### HTML 리포트 열기

```powershell
# Windows
start backend/coverage/index.html
start frontend/coverage/index.html
```

```bash
# macOS
open backend/coverage/index.html
open frontend/coverage/index.html
```

파일을 클릭하면 소스 코드가 표시되며, **빨간색** 줄은 실행되지 않은 코드, **노란색** 표시는 한쪽 경로만 실행된 분기입니다.
`coverage/` 폴더는 `.gitignore`에 포함되어 커밋되지 않습니다.

#### 커버리지 기준 (90%)

`backend/vitest.config.mts`와 `frontend/vitest.config.ts`의 `coverage.thresholds`에 네 지표(statements, branches, functions, lines) 모두 **90%** 기준이 설정되어 있습니다.
하나라도 90% 미만이면 테스트가 모두 통과해도 `test:coverage` 명령이 실패하며, 다음과 같은 메시지가 출력됩니다.

```
ERROR: Coverage for branches (88.5%) does not meet global threshold (90%)
```

새 기능을 추가하면 테스트도 함께 작성해 기준을 유지해 주세요. 측정 대상은 `backend/src/**/*.ts`(타입 전용 `src/lib/types.ts` 제외)와 `frontend/src/**/*.{ts,tsx}`입니다.

#### 현재 커버리지 (2026-09 기준)

| 구분 | 테스트 | Statements | Branches | Functions | Lines |
|------|--------|-----------|----------|-----------|-------|
| backend | 24개 파일 / 235개 | 99.15% | 96.08% | 100% | 99.2% |
| frontend | 13개 파일 / 132개 | 100% | 99.47% | 100% | 100% |

### 테스트 폴더 구조

테스트 코드는 소스(`src/`)와 분리된 `tests/` 폴더에 두고, 소스 구조와 같은 경로로 배치합니다.

```
backend/
├── vitest.config.mts
└── tests/
    ├── setup.ts               # NODE_ENV=test, 외부 API 키 제거, console 출력 숨김
    ├── helpers/
    │   ├── prismaMock.ts      # Prisma 모델(findMany, create 등) 모킹 객체
    │   └── app.ts             # 라우터 단위 express 앱 생성(buildApp), Prisma 오류 생성
    ├── index.test.ts          # 서버 부트스트랩, /health, CORS, 404/500 처리
    ├── lib/                   # ai, vector, amwayProduct, nutrients, kakao, cron, crypto, upload 등
    └── routes/                # API 라우트별 supertest 테스트
frontend/
├── vitest.config.ts
└── tests/
    ├── setup.ts               # jest-dom matcher 등록, 매 테스트 후 DOM·localStorage 정리
    ├── helpers/
    │   ├── apiMock.ts         # axios api(get/post/put/delete) 모킹, deferred 헬퍼
    │   └── render.tsx         # MemoryRouter 렌더 헬퍼, 이동 경로 확인용 LocationProbe
    ├── App.test.tsx           # 라우트 매핑
    ├── main.test.tsx          # 앱 마운트
    ├── lib/                   # api, layout, theme, open
    ├── components/            # ChatPanel, EventCalendar, SeminarAdmin 등
    └── pages/                 # Home, Admin, Products 등
```

### 새 테스트 작성 가이드

**공통 설정**: 두 워크스페이스 모두 `mockReset`, `restoreMocks`, `unstubEnvs`, `unstubGlobals`가 켜져 있어 모킹은 테스트마다 초기화됩니다. 모킹의 반환값은 각 테스트(또는 `beforeEach`)에서 직접 지정하세요.

**백엔드: DB를 사용하는 코드**

```ts
import { vi } from 'vitest';
import { prisma as prismaImport } from '../../src/lib/db';
import type { PrismaMock } from '../helpers/prismaMock';

vi.mock('../../src/lib/db', () => import('../helpers/prismaMock'));
const prisma = prismaImport as unknown as PrismaMock;

prisma.product.findMany.mockResolvedValue([{ id: 'p1' }]);
```

**백엔드: API 라우트**

```ts
import request from 'supertest';
import leadRoutes from '../../src/routes/leads';
import { buildApp } from '../helpers/app';

const res = await request(buildApp(leadRoutes)).get('/');
expect(res.status).toBe(200);
```

**백엔드: 모듈 로드 시점에 환경 변수를 읽는 코드** (`openai.ts`, `crypto.ts`, `kakao.ts`, `vector.ts` 등)

```ts
vi.resetModules();
vi.stubEnv('ENCRYPTION_KEY', 'a'.repeat(64));
const { encrypt } = await import('../../src/lib/crypto');
```

**프론트엔드: API를 호출하는 컴포넌트**

```tsx
import { vi } from 'vitest';
import { api } from '../../src/lib/api';
import { mockApiDefaults } from '../helpers/apiMock';

vi.mock('../../src/lib/api', () => import('../helpers/apiMock'));

beforeEach(() => {
  mockApiDefaults(); // get → { data: [] }, post/put/delete → { data: {} }
});

vi.mocked(api.get).mockResolvedValue({ data: [{ id: '1', name: '더블엑스' }] });
```

**프론트엔드: 라우터가 필요한 컴포넌트**는 `renderWithRouter(<Page />, { route, state })`로, 페이지 이동 결과를 확인할 때는 `renderRoute(path, <Page />)` 후 `screen.getByTestId('location')`을 확인합니다.

### 문제 해결

| 증상 | 원인 / 해결 |
|------|-------------|
| `Unhandled Errors` 경고와 함께 종료 코드가 실패 | 테스트가 끝난 뒤 비동기 렌더링이 오류를 냈습니다. 모킹 응답이 컴포넌트가 기대하는 형태(예: 채팅 응답의 `text`)를 갖췄는지 확인하세요. |
| 날짜·시간 문자열이 환경마다 다름 | 프론트엔드는 `vitest.config.ts`에서 `TZ=Asia/Seoul`로 고정합니다. 백엔드에서 시각을 검증할 때는 `vi.useFakeTimers({ toFake: ['Date'] })`와 `vi.setSystemTime()`을 사용하세요. |
| 모킹한 함수가 `undefined`를 반환 | `mockReset` 설정으로 매 테스트 전에 초기화됩니다. 해당 테스트나 `beforeEach`에서 반환값을 다시 지정하세요. |
| `npm run lint`에서 `src/lib/vector.ts` 타입 오류 | 테스트와 무관하게 Prisma 클라이언트가 생성되지 않은 상태입니다. `.env` 설정 후 `npm run db:generate`를 실행하세요. |

## Docker (선택)

PostgreSQL + Chroma를 로컬로 띄우려면:

```powershell
docker-compose up -d db chroma
# .env의 DATABASE_URL을 PostgreSQL 주소로 변경
```

## 프로젝트 문서

- 기능명세서: `docs/spec-v2.0.txt`
- 개발 규칙: `AGENTS.md`
