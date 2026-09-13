import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ThemeToggle from '../../src/components/ThemeToggle'

describe('ThemeToggle', () => {
  it('저장된 테마가 없으면 nature를 선택하고 적용한다', () => {
    render(<ThemeToggle />)

    expect(screen.getByRole('button', { name: '자연의 초록' })).toHaveAttribute('aria-pressed', 'true')
    expect(document.documentElement.dataset.theme).toBe('nature')
  })

  it('저장된 테마를 복원한다', () => {
    localStorage.setItem('amway-theme-v2', 'spring')
    render(<ThemeToggle />)

    expect(screen.getByRole('button', { name: '맑은 샘' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('버튼을 누르면 테마를 변경하고 저장한다', () => {
    render(<ThemeToggle />)

    fireEvent.click(screen.getByRole('button', { name: '새벽 숲' }))

    expect(screen.getByRole('button', { name: '새벽 숲' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '자연의 초록' })).toHaveAttribute('aria-pressed', 'false')
    expect(document.documentElement.dataset.theme).toBe('forest')
    expect(localStorage.getItem('amway-theme-v2')).toBe('forest')
  })
})
