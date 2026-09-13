import { StrictMode, isValidElement, type ReactElement } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'

const render = vi.hoisted(() => vi.fn())

vi.mock('react-dom/client', () => ({ createRoot: vi.fn(() => ({ render })) }))
vi.mock('../src/App', () => ({ default: () => null }))

describe('main', () => {
  it('#root 요소에 StrictMode로 앱을 마운트한다', async () => {
    document.body.innerHTML = '<div id="root"></div>'

    await import('../src/main')

    expect(createRoot).toHaveBeenCalledWith(document.getElementById('root'))
    const element = render.mock.calls[0][0] as ReactElement
    expect(isValidElement(element)).toBe(true)
    expect(element.type).toBe(StrictMode)
  })
})
