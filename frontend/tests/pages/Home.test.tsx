import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Home from '../../src/pages/Home'
import { mockApiDefaults } from '../helpers/apiMock'
import { renderRoute } from '../helpers/render'

vi.mock('../../src/lib/api', () => import('../helpers/apiMock'))

beforeEach(() => {
  mockApiDefaults()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Home', () => {
  it('뉴스레터 히어로, 프로모션, 행사 캘린더, 서비스 소개를 보여준다', () => {
    renderRoute('/', <Home />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('이달의 웰니스 뉴스레터')
    expect(screen.getAllByRole('link', { name: '프로모션 자세히 보기' })).toHaveLength(3)
    expect(screen.getByRole('heading', { name: '2026년 9월' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '건강 상담 챗봇' })).toBeInTheDocument()
    expect(document.querySelector('.home-sidebar')).toBeInTheDocument()
  })

  it('질문이 비어 있으면 이동하지 않는다', () => {
    renderRoute('/', <Home />)

    fireEvent.submit(screen.getByRole('form', { name: '건강 상담 바로가기' }))

    expect(screen.getByRole('button', { name: '상담 시작하기' })).toBeEnabled()
    expect(screen.queryByTestId('location')).not.toBeInTheDocument()
  })

  it('질문을 입력하면 잠시 후 질문과 함께 채팅 페이지로 이동한다', () => {
    vi.useFakeTimers()
    renderRoute('/', <Home />)

    fireEvent.change(screen.getByLabelText('상담 질문 입력'), { target: { value: '피로 회복' } })
    fireEvent.click(screen.getByRole('button', { name: '상담 시작하기' }))

    expect(screen.getByRole('button', { name: '답변 생성 중…' })).toBeDisabled()

    act(() => {
      vi.advanceTimersByTime(800)
    })

    const location = screen.getByTestId('location')
    expect(location).toHaveTextContent('/chat')
    expect(JSON.parse(location.dataset.state!)).toEqual({ initialQuestion: '피로 회복' })
  })
})
