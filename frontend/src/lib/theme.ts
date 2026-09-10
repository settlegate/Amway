export type Theme = 'nature' | 'forest' | 'sunrise' | 'spring'

export const THEMES: { id: Theme; label: string; concept: string }[] = [
  { id: 'nature', label: '자연의 초록', concept: '건강 · 신뢰 · 자연' },
  { id: 'forest', label: '새벽 숲', concept: '자연 · 천연재료' },
  { id: 'sunrise', label: '아침 햇살', concept: '새로운 시작 · 건강' },
  { id: 'spring', label: '맑은 샘', concept: '정직 · 청량' },
]

const STORAGE_KEY = 'amway-theme-v2'

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* storage unavailable */
  }
}

export function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (
      saved === 'nature' ||
      saved === 'forest' ||
      saved === 'sunrise' ||
      saved === 'spring'
    ) {
      return saved
    }
  } catch {
    /* storage unavailable */
  }
  return 'nature'
}
