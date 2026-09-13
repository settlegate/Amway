import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Business from '../../src/pages/Business'
import Chat from '../../src/pages/Chat'
import Design from '../../src/pages/Design'
import Products from '../../src/pages/Products'
import Reminders from '../../src/pages/Reminders'
import Seminars from '../../src/pages/Seminars'
import { api } from '../../src/lib/api'
import { mockApiDefaults } from '../helpers/apiMock'
import { renderRoute, renderWithRouter } from '../helpers/render'

vi.mock('../../src/lib/api', () => import('../helpers/apiMock'))

const get = vi.mocked(api.get)
const post = vi.mocked(api.post)

beforeEach(() => {
  mockApiDefaults()
})

describe('Chat', () => {
  it('라우터 state 없이 기본 채팅을 보여준다', () => {
    renderWithRouter(<Chat />, { route: '/chat' })

    expect(screen.getByRole('heading', { name: '건강 상담 챗봇' })).toBeInTheDocument()
    expect(screen.getByText(/궁금한 점을 물어보세요/)).toBeInTheDocument()
  })

  it('라우터 state의 이전 대화와 첫 질문을 ChatPanel에 전달한다', async () => {
    post.mockResolvedValue({ data: { text: '답변입니다', products: [] } })

    renderWithRouter(<Chat />, {
      route: '/chat',
      state: { messages: [{ role: 'ai', text: '이전 대화', createdAt: '2026-09-13T00:00:00Z' }], initialQuestion: '피곤해요' },
    })

    expect(screen.getByText('이전 대화')).toBeInTheDocument()
    expect(await screen.findByText('답변입니다')).toBeInTheDocument()
    expect(post.mock.calls[0][1]).toMatchObject({ message: '피곤해요' })
  })
})

describe('Products', () => {
  it('검색어에 따라 제품을 조회하고 상세 정보를 보여준다', async () => {
    get.mockResolvedValue({
      data: [
        { id: '1', name: '더블엑스', description: '종합영양제', benefits: ['면역', '에너지'], dosage: '식후 1포', price: 91000, pv: 45500, bv: 60000, promotion: '추석', purchaseUrl: 'https://buy/1' },
        { id: '2', name: '루테인', benefits: '눈 건강', dosage: '1정', pv: 100, bv: null, aClicUrl: 'https://aclic/2' },
      ],
    })

    renderWithRouter(<Products />)

    expect(await screen.findByText('더블엑스')).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith('/api/products?q=')
    expect(screen.getByText('면역, 에너지')).toBeInTheDocument()
    expect(screen.getByText('눈 건강')).toBeInTheDocument()
    expect(screen.getByText('프로모션: 추석')).toBeInTheDocument()
    expect(screen.getByText('가격: 91,000원')).toBeInTheDocument()
    expect(screen.getByText('PV 45,500 · BV 60,000')).toBeInTheDocument()
    expect(screen.getAllByText(/^PV /)).toHaveLength(1)

    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const buttons = screen.getAllByRole('button', { name: '새창에서 제품 보기' })
    fireEvent.click(buttons[0])
    fireEvent.click(buttons[1])
    expect(open.mock.calls.map((c) => c[0])).toEqual(['https://buy/1', 'https://aclic/2'])

    fireEvent.change(screen.getByPlaceholderText(/증상\/키워드 검색/), { target: { value: '체지방 관리' } })
    await waitFor(() => expect(get).toHaveBeenLastCalledWith(`/api/products?q=${encodeURIComponent('체지방 관리')}`))
  })
})

describe('Reminders', () => {
  it('userId가 없으면 목록을 조회하지 않는다', () => {
    renderWithRouter(<Reminders />)
    expect(get).not.toHaveBeenCalled()
  })

  it('리마인더를 등록하고 사용자 목록을 다시 불러온다', async () => {
    get.mockResolvedValue({ data: [{ id: 'r1', productName: '더블엑스', dosage: '1포', intakeTime: '08:00', cycleDays: 30 }] })
    renderWithRouter(<Reminders />)

    fireEvent.change(screen.getByPlaceholderText('userId'), { target: { value: 'user 1' } })
    fireEvent.change(screen.getByPlaceholderText('제품명'), { target: { value: '더블엑스' } })
    fireEvent.change(screen.getByPlaceholderText('섭취량'), { target: { value: '1포' } })
    fireEvent.change(screen.getByDisplayValue('09:00'), { target: { value: '08:00' } })
    fireEvent.change(screen.getByPlaceholderText('섭취 주기(일)'), { target: { value: '60' } })
    fireEvent.click(screen.getByRole('button', { name: '등록' }))

    await waitFor(() => expect(get).toHaveBeenCalledWith('/api/reminders?userId=user%201'))
    expect(post).toHaveBeenCalledWith('/api/reminders', {
      userId: 'user 1',
      productName: '더블엑스',
      dosage: '1포',
      intakeTime: '08:00',
      cycleDays: 60,
    })
    expect(await screen.findByText('매일 08:00 / 30일분')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('userId')).toHaveValue('user 1')
    expect(screen.getByPlaceholderText('제품명')).toHaveValue('')
  })
})

describe('Seminars', () => {
  const seminars = [
    { id: 's1', title: '뉴트리 세미나', description: '기초', date: '2026-09-20T05:00:00.000Z', location: '강남' },
    { id: 's2', title: '온라인 특강', date: '2026-09-21T05:00:00.000Z' },
  ]

  it('세미나 목록을 보여준다', async () => {
    get.mockResolvedValue({ data: seminars })

    renderWithRouter(<Seminars />)

    expect(await screen.findByText('뉴트리 세미나')).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith('/api/seminars')
    expect(screen.getByText('장소: 강남')).toBeInTheDocument()
    expect(screen.getByText('장소: 미정')).toBeInTheDocument()
  })

  it('이름·연락처가 없으면 신청하지 않고, 입력하면 신청한다', async () => {
    get.mockResolvedValue({ data: seminars })
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {})
    renderWithRouter(<Seminars />)
    const card = (await screen.findByText('뉴트리 세미나')).closest('.card') as HTMLElement

    fireEvent.click(within(card).getByRole('button', { name: '신청하기' }))
    expect(alert).toHaveBeenLastCalledWith('이름과 연락처를 입력해주세요.')
    expect(post).not.toHaveBeenCalled()

    fireEvent.change(screen.getByPlaceholderText('이름'), { target: { value: '홍길동' } })
    fireEvent.change(screen.getByPlaceholderText('연락처'), { target: { value: '010-0000-0000' } })
    fireEvent.click(within(card).getByRole('button', { name: '신청하기' }))

    await waitFor(() => expect(alert).toHaveBeenLastCalledWith('신청이 완료되었습니다.'))
    expect(post).toHaveBeenCalledWith('/api/seminars/s1/apply', { name: '홍길동', phone: '010-0000-0000', userId: '' })
  })
})

describe('Business', () => {
  it('사업 설명 단계와 선택지를 보여준다', async () => {
    get.mockResolvedValue({
      data: {
        headline: '암웨이 ABO 사업 설명',
        steps: [
          { title: '보상 플랜', description: '설명', options: ['수당 계산법 보기', '1:1 사업 상담'] },
          { title: '자산 가치', description: '설명2' },
        ],
      },
    })

    renderWithRouter(<Business />)

    expect(await screen.findByText('암웨이 ABO 사업 설명')).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith('/api/business/stp')
    expect(screen.getByRole('heading', { name: '자산 가치' })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('데이터를 받기 전에는 제목만 보여준다', () => {
    get.mockReturnValue(new Promise(() => {}))
    renderWithRouter(<Business />)

    expect(screen.getByRole('heading', { name: '암웨이 ABO 사업 설명' })).toBeInTheDocument()
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0)
  })
})

describe('Design', () => {
  it('레이아웃 미리보기를 보여주고 적용하면 저장 후 홈으로 이동한다', () => {
    renderRoute('/design', <Design />)

    expect(screen.getAllByRole('button', { name: '이 레이아웃 적용' })).toHaveLength(3)
    expect(screen.queryByRole('log')).not.toBeInTheDocument()

    const card = screen.getByRole('heading', { name: '리드 대시보드' }).closest('article') as HTMLElement
    fireEvent.click(within(card).getByRole('button', { name: '이 레이아웃 적용' }))

    expect(localStorage.getItem('amway-layout')).toBe('split')
    expect(screen.getByTestId('location')).toHaveTextContent('/')
  })
})
