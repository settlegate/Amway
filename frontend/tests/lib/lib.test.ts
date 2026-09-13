import { describe, expect, it, vi } from 'vitest'
import { LAYOUTS, applyLayout, getInitialLayout } from '../../src/lib/layout'
import { THEMES, applyTheme, getInitialTheme } from '../../src/lib/theme'
import { openProductWindow } from '../../src/lib/open'

function breakStorage() {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked')
  })
}

describe('api', () => {
  it('VITE_API_BASE_URL을 baseURL로 사용한다', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.test')
    const { api } = await import('../../src/lib/api')

    expect(api.defaults.baseURL).toBe('https://api.test')
    expect(api.defaults.headers['Content-Type']).toBe('application/json')
  })

  it('환경 변수가 없으면 상대 경로를 사용한다', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_API_BASE_URL', '')
    const { api } = await import('../../src/lib/api')

    expect(api.defaults.baseURL).toBe('')
  })
})

describe('layout', () => {
  it('3가지 레이아웃을 제공한다', () => {
    expect(LAYOUTS.map((l) => l.id)).toEqual(['focus', 'hub', 'split'])
  })

  it.each(['focus', 'hub', 'split'] as const)('저장된 레이아웃 %s 를 복원한다', (mode) => {
    applyLayout(mode)
    expect(localStorage.getItem('amway-layout')).toBe(mode)
    expect(getInitialLayout()).toBe(mode)
  })

  it('저장값이 없거나 잘못되면 split을 기본값으로 사용한다', () => {
    expect(getInitialLayout()).toBe('split')
    localStorage.setItem('amway-layout', 'unknown')
    expect(getInitialLayout()).toBe('split')
  })

  it('스토리지를 사용할 수 없어도 오류 없이 동작한다', () => {
    breakStorage()
    expect(() => applyLayout('hub')).not.toThrow()
    expect(getInitialLayout()).toBe('split')
  })
})

describe('theme', () => {
  it('4가지 테마를 제공한다', () => {
    expect(THEMES.map((t) => t.id)).toEqual(['nature', 'forest', 'sunrise', 'spring'])
  })

  it.each(['nature', 'forest', 'sunrise', 'spring'] as const)('테마 %s 를 적용하고 복원한다', (theme) => {
    applyTheme(theme)
    expect(document.documentElement.dataset.theme).toBe(theme)
    expect(getInitialTheme()).toBe(theme)
  })

  it('저장값이 없거나 잘못되면 nature를 기본값으로 사용한다', () => {
    expect(getInitialTheme()).toBe('nature')
    localStorage.setItem('amway-theme-v2', 'dark')
    expect(getInitialTheme()).toBe('nature')
  })

  it('스토리지를 사용할 수 없어도 테마는 적용된다', () => {
    breakStorage()
    applyTheme('forest')
    expect(document.documentElement.dataset.theme).toBe('forest')
    expect(getInitialTheme()).toBe('nature')
  })
})

describe('openProductWindow', () => {
  it.each([undefined, '', '#'])('URL이 없으면(%s) 새 창을 열지 않는다', (url) => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    openProductWindow(url)
    expect(open).not.toHaveBeenCalled()
  })

  it('제품 URL을 팝업 창으로 연다', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    openProductWindow('https://amway/p/1')
    expect(open).toHaveBeenCalledWith(
      'https://amway/p/1',
      '_blank',
      'width=1200,height=800,left=50,top=50,noopener,noreferrer',
    )
  })
})
