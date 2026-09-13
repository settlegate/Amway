import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { mockApiDefaults } from '../helpers/apiMock'

vi.mock('../../src/lib/api', () => import('../helpers/apiMock'))

const KAKAO_URL = 'https://open.kakao.com/o/test'

const cookingClass = {
  id: 'cook',
  title: '추석 쿠킹 클래스',
  date: '2026-09-15T12:00:00+09:00',
}

// KAKAO_URL은 모듈 로드 시점에 읽으므로 환경 변수별로 모듈을 새로 로드한다
async function load({ kakaoUrl = '', seminars = [] as unknown }: { kakaoUrl?: string; seminars?: unknown } = {}) {
  vi.resetModules()
  vi.stubEnv('VITE_KAKAO_CHANNEL_URL', kakaoUrl)
  const { api } = (await import('../../src/lib/api')) as unknown as { api: Parameters<typeof mockApiDefaults>[0] }
  mockApiDefaults(api)
  if (seminars instanceof Error) api.get.mockRejectedValue(seminars)
  else api.get.mockResolvedValue({ data: seminars })
  const { default: EventCalendar } = await import('../../src/components/EventCalendar')
  return { api, EventCalendar }
}

const titles = () => Array.from(document.querySelectorAll('.day-card .title')).map((el) => el.textContent)

describe('EventCalendar', () => {
  it('2026년 9월 기본 일정을 날짜순으로 보여준다', async () => {
    const { api, EventCalendar } = await load()

    render(<EventCalendar />)

    expect(screen.getByRole('heading', { name: '2026년 9월' })).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/api/seminars')
    expect(titles()).toHaveLength(7)
    expect(titles()[0]).toBe('OMR 리더십 특강')
    expect(screen.getByText(/^3일\(.\), AM 10시$/)).toBeInTheDocument()
    expect(screen.getByText(/^10일\(.\), PM 2시$/)).toBeInTheDocument()
    expect(screen.getAllByText('온라인')).toHaveLength(2)
  })

  it('서버 일정을 합쳐서 날짜순으로 정렬하고 장소가 없으면 미정으로 표시한다', async () => {
    const { EventCalendar } = await load({
      seminars: [cookingClass, { id: 'midnight', title: '자정 행사', date: '2026-09-01T00:00:00+09:00' }],
    })

    render(<EventCalendar />)

    expect(await screen.findByText('추석 쿠킹 클래스')).toBeInTheDocument()
    expect(titles()[0]).toBe('자정 행사')
    expect(screen.getByText(/^1일\(.\), AM 12시$/)).toBeInTheDocument()
    expect(screen.getByText(/^15일\(.\), PM 12시$/)).toBeInTheDocument()
    expect(screen.getAllByText('장소 미정')).toHaveLength(2)
  })

  it.each([{ not: 'array' }, new Error('offline')])('서버 응답이 비정상이면 기본 일정만 보여준다', async (seminars) => {
    const { EventCalendar } = await load({ seminars })

    render(<EventCalendar />)
    await Promise.resolve()

    expect(titles()).toHaveLength(7)
  })

  it('이전/다음 달로 이동하고 일정이 없으면 안내 문구를 보여준다', async () => {
    const { EventCalendar } = await load()
    render(<EventCalendar />)

    fireEvent.click(screen.getByRole('button', { name: '이전 달' }))
    expect(screen.getByRole('heading', { name: '2026년 8월' })).toBeInTheDocument()
    expect(screen.getByText('아직 등록된 일정이 없어요')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '다음 달' }))
    fireEvent.click(screen.getByRole('button', { name: '다음 달' }))
    expect(screen.getByRole('heading', { name: '2026년 10월' })).toBeInTheDocument()
  })

  it('카카오 채널 URL이 있으면 쿠킹 클래스 카드를 눌러 신청 창을 연다', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const { EventCalendar } = await load({ kakaoUrl: KAKAO_URL, seminars: [cookingClass] })
    render(<EventCalendar />)

    const card = await screen.findByRole('button', { name: '카카오톡으로 쿠킹 클래스 신청하기' })
    expect(card).toHaveClass('cooking')
    expect(card.querySelector('.kakao-overlay')).toBeInTheDocument()

    fireEvent.click(card)
    fireEvent.keyDown(card, { key: 'Enter' })
    fireEvent.keyDown(card, { key: ' ' })
    fireEvent.keyDown(card, { key: 'Escape' })

    expect(open).toHaveBeenCalledTimes(3)
    expect(open).toHaveBeenCalledWith(KAKAO_URL, '_blank', 'noopener,noreferrer')
  })

  it('일반 일정 카드는 키 입력에 반응하지 않는다', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const { EventCalendar } = await load({ kakaoUrl: KAKAO_URL })
    render(<EventCalendar />)

    const card = screen.getByText('OMR 리더십 특강').closest('.day-card')!
    expect(card).not.toHaveAttribute('role')
    fireEvent.keyDown(card, { key: 'Enter' })

    expect(open).not.toHaveBeenCalled()
  })

  it('카카오 채널 URL이 없으면 쿠킹 클래스 카드를 눌러도 창을 열지 않는다', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const { EventCalendar } = await load({ seminars: [cookingClass] })
    render(<EventCalendar />)

    const card = await screen.findByRole('button', { name: '카카오톡으로 쿠킹 클래스 신청하기' })
    expect(card.querySelector('.kakao-overlay')).toBeNull()
    fireEvent.click(card)
    fireEvent.keyDown(card, { key: 'Enter' })

    expect(open).not.toHaveBeenCalled()
  })
})
