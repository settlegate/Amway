# GitHub 보안 점검 결과 — 2026-11-03

- 대상 저장소: `settlegate/Amway` (브랜치 `main`/`feature/admin-product-sync`, HEAD `b8b6619`)
- 점검 방법: GitHub REST API(`security_and_analysis`, dependabot/code-scanning/secret-scanning alerts) + 로컬 `npm audit`

## 1. GitHub Security 기능 상태

| 기능 | 상태 | 결과 |
|---|---|---|
| Secret scanning | **활성** | 오픈 알럿 **0건** — 유출된 비밀값 없음 |
| Secret scanning push protection | **활성** | 커밋 단계 비밀값 차단 동작 중 |
| Dependabot alerts | **비활성 → 2026-11-03 활성화 완료** | API로 켰으며 이후 취약점 자동 알림 |
| Dependabot security updates | **비활성 → 2026-11-03 활성화 완료** | 자동 패치 PR 생성됨 |
| Code scanning (CodeQL) | **미설정** | 분석 없음 — 코드 취약점 스캔 안 함 |

## 2. `npm audit` — 백엔드 루트 (운영 의존성)

총 **10건** — critical 1, high 5, moderate 4

| 심각도 | 패키지 | 내용 | 조치 |
|---|---|---|---|
| **critical** | `proxy-addr` (express 하위) | IPv4-mapped IPv6 신뢰 서브넷 IP 스푸핑 (GHSA-jqcg-44mw-7w3h) | `npm audit fix`로 자동 수정 가능 |
| high | `body-parser` | 압축 바디 뒤 데이터로 DoS (GHSA-27r3-jxmh-p828) | `npm audit fix` |
| high | `follow-redirects` | 크로스오리진 자격증명 헤더 유출 3건 | `npm audit fix` |
| high | `multer` | 업로드 중단 시 DoS 2건 | `npm audit fix` |
| high | `zod` (openai 경유) | 대형 컬렉션 검증 시 메모리 고갈 (GHSA-mrhx-c7xc-m3w5) | **메이저 업그레이드 필요** (zod@4.6.7, breaking) |
| moderate | `morgan` | 로그 인젝션 | `npm audit fix` |
| moderate | `qs` | 배열 파싱 DoS 3건 | `npm audit fix` |
| moderate | `uuid` (node-cron 경유) | 버퍼 경계 미검사 | **메이저 업그레이드 필요** (node-cron@4.6.0, breaking) |

## 3. `npm audit` — 프론트엔드

총 **7건** — high 4, moderate 3. 전부 **개발/빌드 도구** 계열(vite, vitest, launch-editor, undici, source-map-js, follow-redirects)이라 실배포 서비스 노출 위험은 낮음. `npm audit fix`로 정리 가능.

## 4. 처리 결과 (2026-11-03)

- [완료] Dependabot alerts + security updates 활성화 (API로 적용 확인)
- [완료] `npm audit fix` 루트+프론트 실행 — critical `proxy-addr` 및 다수 자동 수정
- [완료] 수정 후 회귀 테스트: 백엔드 235개·프론트엔드 129개 전부 통과
- [잔여] breaking 변경 2건 (수동 검토 필요):
  - `openai`의 zod v4 업그레이드 — AI 응답 스키마 코드 영향 확인 후 진행
  - `node-cron` 메이저 업그레이드 — 스케줄러 코드 확인 후 진행
  - `qs`(express 하위) moderate — 상위 패키지 릴리스 대기
  - 프론트엔드 `vitest` 관련 moderate 3건 — dev 전용, 메이저 업그레이드 필요
- [선택] CodeQL code scanning 워크플로 추가 (JS/TS 분석)
- [양호 유지] `.env`/비밀값 미커밋 상태 — secret scanning 알럿 0건으로 확인됨
