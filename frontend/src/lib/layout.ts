export type LayoutMode = 'focus' | 'hub' | 'split'

export const LAYOUTS: { id: LayoutMode; label: string; desc: string }[] = [
  {
    id: 'focus',
    label: '대화 집중',
    desc: '챗봇이 전면에 배치된 중심형',
  },
  {
    id: 'hub',
    label: '웰니스 허브',
    desc: '검색·서비스·챗봇이 한 화면에 모인 허브형',
  },
  {
    id: 'split',
    label: '리드 대시보드',
    desc: '프로필·알림과 챗봇이 나란한 분할형',
  },
]

const STORAGE_KEY = 'amway-layout'

export function applyLayout(mode: LayoutMode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    /* storage unavailable */
  }
}

export function getInitialLayout(): LayoutMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'focus' || saved === 'hub' || saved === 'split') {
      return saved
    }
  } catch {
    /* storage unavailable */
  }
  return 'split'
}
