import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Admin from '../../src/pages/Admin'
import { api } from '../../src/lib/api'
import { mockApiDefaults } from '../helpers/apiMock'

vi.mock('../../src/lib/api', () => import('../helpers/apiMock'))

const get = vi.mocked(api.get)
const post = vi.mocked(api.post)
const put = vi.mocked(api.put)
const del = vi.mocked(api.delete)

const FIXTURES: Record<string, unknown> = {
  '/api/admin/dashboard': {
    counts: { userCount: 5, leadCount: 3, seminarCount: 2, bodyRecordCount: 7 },
    followUpLeads: [
      { id: 'l1', user: { name: '김고객' }, category: '건강', status: 'FOLLOW_UP', notes: '다음 주 연락' },
      { id: 'l2', status: 'NEW' },
    ],
  },
  '/api/admin/products': [
    { id: 'p1', code: 'D', name: '더블엑스', category: '비타민', price: 91000, pv: 45500, bv: 60000, promotion: '추석 할인', imageUrl: 'd.jpg', lastSyncedAt: '2026-09-01T00:00:00Z', isActive: true },
    { id: 'p2', code: 'L', name: '루테인', category: '눈', price: 30000, pv: null, bv: null, isActive: true },
  ],
  '/api/admin/promotions': [
    { id: 'pr1', title: '추석 프로모션', description: '혜택 안내', productId: 'p1', product: { id: 'p1', code: 'D', name: '더블엑스' }, startAt: '2026-09-01T00:00:00.000Z', endAt: '2026-09-30T00:00:00.000Z', isActive: true, createdAt: '' },
    { id: 'pr2', title: '가을 행사', isActive: false, createdAt: '' },
  ],
  '/api/admin/home-promotions': [
    { id: 'h1', imageUrl: 'h1.png', alt: '추석 배너', targetUrl: 'https://promo/1', isActive: true },
    { id: 'h2', imageUrl: 'h2.png', targetUrl: 'https://promo/2', isActive: false },
    { id: 'h3', targetUrl: 'https://promo/3', isActive: true },
  ],
  '/api/admin/seminars': [],
}

function mockGets(overrides: Record<string, unknown> = {}) {
  const data = { ...FIXTURES, ...overrides }
  get.mockImplementation(async (url: string) => ({ data: data[url] }))
}

const cardOf = (text: string) => screen.getByText(text).closest('.card') as HTMLElement
const status = (text: string | RegExp) => screen.findByText(text, { selector: '[role="status"]' })

async function renderAdmin(overrides?: Record<string, unknown>) {
  mockGets(overrides)
  render(<Admin />)
  await screen.findByText('5명')
}

beforeEach(() => {
  mockApiDefaults()
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})

describe('Admin 대시보드', () => {
  it('집계, 제품, 프로모션, 홈 배너, 후속 리드를 보여준다', async () => {
    await renderAdmin()

    expect(screen.getByText('3건')).toBeInTheDocument()
    expect(screen.getByText('2개')).toBeInTheDocument()
    expect(screen.getByText('7건')).toBeInTheDocument()

    expect(screen.getByText('비타민 · 91,000원 · PV 45,500 · BV 60,000')).toBeInTheDocument()
    expect(screen.getByText('눈 · 30,000원')).toBeInTheDocument()
    expect(screen.getByText('프로모션: 추석 할인')).toBeInTheDocument()
    expect(screen.getAllByText(/^마지막 동기화:/)).toHaveLength(1)
    expect(screen.getByAltText('더블엑스')).toHaveAttribute('src', 'd.jpg')

    expect(within(cardOf('추석 프로모션')).getByText('연결 제품: 더블엑스')).toBeInTheDocument()
    expect(within(cardOf('추석 프로모션')).getByText('혜택 안내')).toBeInTheDocument()
    expect(within(cardOf('추석 프로모션')).getByText(/^기간: 2026\. 9\. 1\. ~ 2026\. 9\. 30\.$/)).toBeInTheDocument()
    expect(within(cardOf('가을 행사')).getByText('기간: - ~ -')).toBeInTheDocument()
    expect(within(cardOf('가을 행사')).getByRole('button', { name: '비활성' })).toBeInTheDocument()

    expect(screen.getByAltText('추석 배너')).toHaveAttribute('src', 'h1.png')
    expect(screen.getByAltText('배너 이미지')).toHaveAttribute('src', 'h2.png')
    expect(within(cardOf('https://promo/2')).getByText('상태: 비활성')).toBeInTheDocument()
    expect(cardOf('https://promo/3').querySelector('img')).toBeNull()

    expect(screen.getByText('김고객')).toBeInTheDocument()
    expect(screen.getByText('다음 주 연락')).toBeInTheDocument()
    expect(screen.getByText('익명')).toBeInTheDocument()
    expect(screen.getByText(/미분류/)).toBeInTheDocument()
  })

  it('데이터가 없으면 기본값과 빈 목록 안내를 보여준다', async () => {
    mockGets({
      '/api/admin/dashboard': null,
      '/api/admin/products': [],
      '/api/admin/promotions': [],
      '/api/admin/home-promotions': [],
    })

    render(<Admin />)

    expect(await screen.findByText('등록된 프로모션이 없습니다.')).toBeInTheDocument()
    expect(screen.getByText('0명')).toBeInTheDocument()
    expect(screen.getAllByText('0건')).toHaveLength(2)
    expect(screen.getByText('등록된 홈 배너가 없습니다.')).toBeInTheDocument()
  })
})

describe('Admin 제품 동기화', () => {
  it('URL이 없으면 입력 안내를 보여준다', async () => {
    await renderAdmin()

    fireEvent.click(screen.getByRole('button', { name: '이 URL 동기화' }))

    expect(await status('암웨이 상품 페이지 URL을 입력해주세요.')).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })

  it.each([
    ['', undefined],
    ['비타민', '비타민'],
  ])('단일 URL을 동기화하고 목록을 다시 불러온다 (카테고리="%s")', async (category, expected) => {
    post.mockResolvedValue({ data: { name: '더블엑스' } })
    await renderAdmin()
    fireEvent.change(screen.getByPlaceholderText(/^예: https/), { target: { value: 'https://amway/p/1' } })
    fireEvent.change(screen.getByPlaceholderText(/^카테고리/), { target: { value: category } })

    fireEvent.click(screen.getByRole('button', { name: '이 URL 동기화' }))

    expect(await status('동기화 완료: 더블엑스')).toBeInTheDocument()
    expect(post).toHaveBeenCalledWith('/api/admin/products/sync', { url: 'https://amway/p/1', category: expected })
    expect(screen.getByPlaceholderText(/^예: https/)).toHaveValue('')
    await waitFor(() => expect(get.mock.calls.filter(([url]) => url === '/api/admin/products')).toHaveLength(2))
  })

  it('동기화 중에는 버튼을 비활성화한다', async () => {
    post.mockReturnValue(new Promise(() => {}))
    await renderAdmin()
    fireEvent.change(screen.getByPlaceholderText(/^예: https/), { target: { value: 'https://amway/p/1' } })

    fireEvent.click(screen.getByRole('button', { name: '이 URL 동기화' }))

    expect(await screen.findByRole('button', { name: '동기화 중...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '전체 제품 동기화' })).toBeDisabled()
  })

  it.each([
    [{ response: { data: { error: '파싱 실패' } } }, '파싱 실패'],
    [new Error('network'), '제품 동기화에 실패했습니다.'],
  ])('단일 동기화 실패 메시지를 보여준다', async (error, message) => {
    post.mockRejectedValue(error)
    await renderAdmin()
    fireEvent.change(screen.getByPlaceholderText(/^예: https/), { target: { value: 'https://amway/p/1' } })

    fireEvent.click(screen.getByRole('button', { name: '이 URL 동기화' }))

    expect(await status(message)).toBeInTheDocument()
  })

  it('전체 제품을 동기화한다', async () => {
    const pending = Promise.withResolvers<{ data: { synced: number } }>()
    post.mockReturnValue(pending.promise as any)
    await renderAdmin()

    fireEvent.click(screen.getByRole('button', { name: '전체 제품 동기화' }))

    expect(await screen.findByRole('button', { name: '전체 동기화 중...' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('전체 제품 동기화 중...')
    pending.resolve({ data: { synced: 12 } })
    expect(await status('전체 동기화 완료: 12개 제품')).toBeInTheDocument()
    expect(post).toHaveBeenCalledWith('/api/admin/products/sync-all')
  })

  it.each([
    [{ response: { data: { error: '시간 초과' } } }, '시간 초과'],
    [new Error('network'), '전체 동기화에 실패했습니다.'],
  ])('전체 동기화 실패 메시지를 보여준다', async (error, message) => {
    post.mockRejectedValue(error)
    await renderAdmin()

    fireEvent.click(screen.getByRole('button', { name: '전체 제품 동기화' }))

    expect(await status(message)).toBeInTheDocument()
  })
})

describe('Admin 프로모션 관리', () => {
  const titleInput = () => screen.getByPlaceholderText(/^프로모션 제목/)

  it('제목이 없으면 입력 안내를 보여준다', async () => {
    await renderAdmin()

    fireEvent.click(screen.getByRole('button', { name: '프로모션 등록' }))

    expect(await status('프로모션 제목을 입력해주세요.')).toBeInTheDocument()
  })

  it('모든 항목을 입력해 프로모션을 등록한다', async () => {
    await renderAdmin()
    fireEvent.change(titleInput(), { target: { value: '신규 프로모션' } })
    fireEvent.change(screen.getByPlaceholderText(/^프로모션 설명/), { target: { value: '설명' } })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'p2' } })
    fireEvent.change(screen.getByLabelText('시작일'), { target: { value: '2026-10-01' } })
    fireEvent.change(screen.getByLabelText('종료일'), { target: { value: '2026-10-31' } })
    fireEvent.click(screen.getAllByLabelText('활성화')[0])

    fireEvent.click(screen.getByRole('button', { name: '프로모션 등록' }))

    expect(await status('프로모션이 등록되었습니다.')).toBeInTheDocument()
    expect(post).toHaveBeenCalledWith('/api/admin/promotions', {
      title: '신규 프로모션',
      description: '설명',
      productId: 'p2',
      startAt: '2026-10-01',
      endAt: '2026-10-31',
      isActive: false,
    })
    expect(titleInput()).toHaveValue('')
  })

  it('제목만 입력하면 나머지는 null로 등록한다', async () => {
    const pending = Promise.withResolvers<unknown>()
    post.mockReturnValue(pending.promise as any)
    await renderAdmin()
    fireEvent.change(titleInput(), { target: { value: '간단 프로모션' } })

    fireEvent.click(screen.getByRole('button', { name: '프로모션 등록' }))

    expect(await screen.findByRole('button', { name: '저장 중...' })).toBeDisabled()
    expect(post.mock.calls[0][1]).toEqual({
      title: '간단 프로모션',
      description: null,
      productId: null,
      startAt: null,
      endAt: null,
      isActive: true,
    })
    pending.resolve({ data: {} })
    expect(await status('프로모션이 등록되었습니다.')).toBeInTheDocument()
  })

  it('기존 프로모션을 수정한다', async () => {
    await renderAdmin()

    fireEvent.click(within(cardOf('추석 프로모션')).getByRole('button', { name: '수정' }))

    expect(screen.getByRole('heading', { name: '프로모션 수정' })).toBeInTheDocument()
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    expect(titleInput()).toHaveValue('추석 프로모션')
    expect(screen.getByLabelText('시작일')).toHaveValue('2026-09-01')
    expect(screen.getByRole('combobox')).toHaveValue('p1')

    fireEvent.click(screen.getByRole('button', { name: '수정 저장' }))

    expect(await status('프로모션이 수정되었습니다.')).toBeInTheDocument()
    expect(put).toHaveBeenCalledWith('/api/admin/promotions/pr1', {
      title: '추석 프로모션',
      description: '혜택 안내',
      productId: 'p1',
      startAt: '2026-09-01',
      endAt: '2026-09-30',
      isActive: true,
    })
    expect(screen.getByRole('heading', { name: '프로모션 / 일정 등록' })).toBeInTheDocument()
  })

  it('선택 값이 없는 프로모션을 수정하다가 취소한다', async () => {
    await renderAdmin()

    fireEvent.click(within(cardOf('가을 행사')).getByRole('button', { name: '수정' }))

    expect(titleInput()).toHaveValue('가을 행사')
    expect(screen.getByPlaceholderText(/^프로모션 설명/)).toHaveValue('')
    expect(screen.getByLabelText('종료일')).toHaveValue('')
    expect(screen.getAllByLabelText('활성화')[0]).not.toBeChecked()

    fireEvent.click(screen.getByRole('button', { name: '취소' }))

    expect(titleInput()).toHaveValue('')
    expect(screen.queryByRole('button', { name: '취소' })).not.toBeInTheDocument()
  })

  it.each([
    [{ response: { data: { error: '중복된 제목' } } }, '중복된 제목'],
    [new Error('network'), '프로모션 저장에 실패했습니다.'],
  ])('저장 실패 메시지를 보여준다', async (error, message) => {
    post.mockRejectedValue(error)
    await renderAdmin()
    fireEvent.change(titleInput(), { target: { value: '프로모션' } })

    fireEvent.click(screen.getByRole('button', { name: '프로모션 등록' }))

    expect(await status(message)).toBeInTheDocument()
  })

  it('활성 상태를 토글하고 삭제한다', async () => {
    await renderAdmin()

    fireEvent.click(within(cardOf('추석 프로모션')).getByRole('button', { name: '활성' }))
    await waitFor(() => expect(put).toHaveBeenCalledWith('/api/admin/promotions/pr1', { isActive: false }))

    fireEvent.click(within(cardOf('가을 행사')).getByRole('button', { name: '삭제' }))
    expect(await status('프로모션을 삭제했습니다.')).toBeInTheDocument()
    expect(del).toHaveBeenCalledWith('/api/admin/promotions/pr2')
    await waitFor(() => expect(get.mock.calls.filter(([url]) => url === '/api/admin/promotions')).toHaveLength(3))
  })
})

describe('Admin 홈 프로모션 배너', () => {
  const fileInput = () => document.querySelector('input[type="file"]') as HTMLInputElement
  const registerButton = () => screen.getByRole('button', { name: '배너 등록' })

  it('이미지와 링크가 없으면 입력 안내를 보여준다', async () => {
    await renderAdmin()

    fireEvent.click(registerButton())
    expect(await status('프로모션 이미지를 선택해주세요.')).toBeInTheDocument()

    fireEvent.change(fileInput(), { target: { files: [new File(['x'], 'banner.png', { type: 'image/png' })] } })
    expect(screen.getByText('선택 파일: banner.png')).toBeInTheDocument()
    fireEvent.click(registerButton())
    expect(await status('프로모션 링크 URL을 입력해주세요.')).toBeInTheDocument()

    fireEvent.change(fileInput(), { target: { files: [] } })
    expect(screen.queryByText(/^선택 파일:/)).not.toBeInTheDocument()
  })

  it('multipart 폼으로 배너를 등록하고 폼을 초기화한다', async () => {
    const pending = Promise.withResolvers<unknown>()
    post.mockReturnValue(pending.promise as any)
    await renderAdmin()
    const file = new File(['x'], 'banner.png', { type: 'image/png' })
    fireEvent.change(fileInput(), { target: { files: [file] } })
    fireEvent.change(screen.getByPlaceholderText('프로모션 링크 URL'), { target: { value: 'https://promo/new' } })
    fireEvent.change(screen.getByPlaceholderText(/^이미지 설명/), { target: { value: '신규' } })
    fireEvent.click(screen.getAllByLabelText('활성화')[1])

    fireEvent.click(registerButton())

    expect(await screen.findByRole('button', { name: '등록 중...' })).toBeDisabled()
    const [url, form, config] = post.mock.calls[0] as [string, FormData, unknown]
    expect(url).toBe('/api/admin/home-promotions')
    expect(config).toEqual({ headers: { 'Content-Type': 'multipart/form-data' } })
    expect((form.get('image') as File).name).toBe('banner.png')
    expect(form.get('targetUrl')).toBe('https://promo/new')
    expect(form.get('alt')).toBe('신규')
    expect(form.get('isActive')).toBe('false')

    pending.resolve({ data: {} })
    expect(await status('홈 프로모션 배너가 등록되었습니다.')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('프로모션 링크 URL')).toHaveValue('')
    expect(screen.getAllByLabelText('활성화')[1]).toBeChecked()
  })

  it('활성 상태로 등록하면 isActive=true를 보낸다', async () => {
    await renderAdmin()
    fireEvent.change(fileInput(), { target: { files: [new File(['x'], 'b.png', { type: 'image/png' })] } })
    fireEvent.change(screen.getByPlaceholderText('프로모션 링크 URL'), { target: { value: 'https://promo/new' } })

    fireEvent.click(registerButton())

    await waitFor(() => expect(post).toHaveBeenCalled())
    expect((post.mock.calls[0][1] as FormData).get('isActive')).toBe('true')
  })

  it.each([
    [{ response: { data: { error: '용량 초과' } } }, '용량 초과'],
    [new Error('network'), '홈 프로모션 배너 등록에 실패했습니다.'],
  ])('등록 실패 메시지를 보여준다', async (error, message) => {
    post.mockRejectedValue(error)
    await renderAdmin()
    fireEvent.change(fileInput(), { target: { files: [new File(['x'], 'b.png', { type: 'image/png' })] } })
    fireEvent.change(screen.getByPlaceholderText('프로모션 링크 URL'), { target: { value: 'https://promo/new' } })

    fireEvent.click(registerButton())

    expect(await status(message)).toBeInTheDocument()
  })

  it('배너 활성 상태를 토글하고 삭제한다', async () => {
    await renderAdmin()

    fireEvent.click(within(cardOf('https://promo/1')).getByRole('button', { name: '활성' }))
    await waitFor(() => expect(put).toHaveBeenCalledWith('/api/admin/home-promotions/h1', { isActive: false }))

    fireEvent.click(within(cardOf('https://promo/2')).getByRole('button', { name: '비활성' }))
    await waitFor(() => expect(put).toHaveBeenCalledWith('/api/admin/home-promotions/h2', { isActive: true }))

    fireEvent.click(within(cardOf('https://promo/2')).getByRole('button', { name: '삭제' }))
    expect(await status('홈 프로모션 배너가 삭제되었습니다.')).toBeInTheDocument()
    expect(del).toHaveBeenCalledWith('/api/admin/home-promotions/h2')
  })
})
