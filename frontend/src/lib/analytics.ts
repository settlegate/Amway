import { api } from './api'

const VISITOR_KEY = 'joohee_visitor_id'
const DEDUPE_MS = 1500

let memoryVisitorId = ''
let lastTrackKey = ''
let lastTrackAt = 0

export function getVisitorId(): string {
  if (memoryVisitorId) return memoryVisitorId
  try {
    const saved = localStorage.getItem(VISITOR_KEY)
    if (saved) {
      memoryVisitorId = saved
      return saved
    }
  } catch {
    // localStorage를 쓸 수 없는 환경(카카오 웹뷰 시크릿 모드 등)에서는 메모리 ID 사용
  }
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`
  memoryVisitorId = id
  try {
    localStorage.setItem(VISITOR_KEY, id)
  } catch {
    // 저장 실패해도 세션 내에서는 메모리 ID로 동작
  }
  return id
}

function shouldSkip(key: string): boolean {
  const now = Date.now()
  if (key === lastTrackKey && now - lastTrackAt < DEDUPE_MS) return true
  lastTrackKey = key
  lastTrackAt = now
  return false
}

export function trackPageView(path: string) {
  if (shouldSkip(`p:${path}`)) return
  api
    .post('/api/analytics/track', {
      visitorId: getVisitorId(),
      path,
      type: 'pageview',
    })
    .catch(() => {})
}

export function trackContentView(contentType: string, contentId: string, contentName?: string) {
  if (shouldSkip(`c:${contentType}:${contentId}`)) return
  api
    .post('/api/analytics/track', {
      visitorId: getVisitorId(),
      path: window.location.pathname,
      type: 'content',
      contentType,
      contentId,
      contentName,
    })
    .catch(() => {})
}
