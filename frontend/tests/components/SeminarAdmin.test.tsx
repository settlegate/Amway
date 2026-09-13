import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SeminarAdmin from '../../src/components/SeminarAdmin'
import { api } from '../../src/lib/api'
import { mockApiDefaults } from '../helpers/apiMock'

vi.mock('../../src/lib/api', () => import('../helpers/apiMock'))

const get = vi.mocked(api.get)
const post = vi.mocked(api.post)

const seminars = [
  { id: 's1', title: '뉴트리 세미나', description: '기초 교육', date: '2026-09-20T05:00:00.000Z', location: '강남', maxAttendees: 20, createdAt: '' },
  { id: 's2', title: '온라인 특강', description: null, date: '2026-09-21T05:00:00.000Z', location: null, maxAttendees: 20, createdAt: '' },
]

beforeEach(() => {
  mockApiDefaults()
})

function fill(placeholderOrLabel: string, value: string) {
  const el = screen.queryByPlaceholderText(placeholderOrLabel) ?? screen.getByLabelText(placeholderOrLabel)
  fireEvent.change(el, { target: { value } })
}

describe('SeminarAdmin', () => {
  it('등록된 일정이 없으면 안내 문구를 보여준다', async () => {
    render(<SeminarAdmin />)

    expect(await screen.findByText('등록된 일정이 없습니다.')).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith('/api/admin/seminars')
  })

  it('일정 목록을 보여준다', async () => {
    get.mockResolvedValue({ data: seminars })

    render(<SeminarAdmin />)

    expect(await screen.findByText('뉴트리 세미나')).toBeInTheDocument()
    expect(screen.getByText('기초 교육')).toBeInTheDocument()
    expect(screen.getByText(/· 강남$/)).toBeInTheDocument()
    expect(screen.getByText(/· 장소 미정$/)).toBeInTheDocument()
  })

  it('제목이나 날짜가 없으면 입력 안내를 보여준다', async () => {
    render(<SeminarAdmin />)

    fireEvent.click(screen.getByRole('button', { name: '일정 등록' }))

    expect(await screen.findByRole('status')).toHaveTextContent('일정 제목과 날짜/시간을 입력해주세요.')
    expect(post).not.toHaveBeenCalled()
  })

  it('일정을 등록하고 폼을 초기화한다', async () => {
    render(<SeminarAdmin />)
    fill('일정 제목', '쿠킹 클래스')
    fill('일정 날짜 및 시간', '2026-09-20T14:00')
    fill('장소', '잠실')
    fill('최대 참석자 수', '0')
    fill('설명 (선택)', '추석 요리')

    fireEvent.click(screen.getByRole('button', { name: '일정 등록' }))

    expect(await screen.findByText('일정을 등록했습니다.')).toBeInTheDocument()
    expect(post).toHaveBeenCalledWith('/api/admin/seminars', {
      title: '쿠킹 클래스',
      description: '추석 요리',
      date: new Date('2026-09-20T14:00').toISOString(),
      location: '잠실',
      maxAttendees: 20,
    })
    expect(screen.getByPlaceholderText('일정 제목')).toHaveValue('')
    expect(get).toHaveBeenCalledTimes(2)
  })

  it('선택 필드가 비어 있으면 null로 보낸다', async () => {
    render(<SeminarAdmin />)
    fill('일정 제목', '특강')
    fill('일정 날짜 및 시간', '2026-09-20T14:00')
    fill('최대 참석자 수', '35')

    fireEvent.click(screen.getByRole('button', { name: '일정 등록' }))

    await waitFor(() => expect(post).toHaveBeenCalled())
    expect(post.mock.calls[0][1]).toMatchObject({ description: null, location: null, maxAttendees: 35 })
  })

  it('등록 중에는 버튼을 비활성화한다', async () => {
    post.mockReturnValue(new Promise(() => {}))
    render(<SeminarAdmin />)
    fill('일정 제목', '특강')
    fill('일정 날짜 및 시간', '2026-09-20T14:00')

    fireEvent.click(screen.getByRole('button', { name: '일정 등록' }))

    expect(await screen.findByRole('button', { name: '등록 중...' })).toBeDisabled()
  })

  it.each([
    [{ response: { data: { error: '서버 오류' } } }, '서버 오류'],
    [new Error('network'), '일정 등록에 실패했습니다.'],
  ])('등록 실패 메시지를 보여준다', async (error, message) => {
    post.mockRejectedValue(error)
    render(<SeminarAdmin />)
    fill('일정 제목', '특강')
    fill('일정 날짜 및 시간', '2026-09-20T14:00')

    fireEvent.click(screen.getByRole('button', { name: '일정 등록' }))

    expect(await screen.findByText(message)).toBeInTheDocument()
  })

  it('삭제 확인 시에만 일정을 삭제하고 목록을 다시 불러온다', async () => {
    get.mockResolvedValue({ data: seminars })
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    render(<SeminarAdmin />)
    const card = (await screen.findByText('뉴트리 세미나')).closest('.card') as HTMLElement

    fireEvent.click(within(card).getByRole('button', { name: '삭제' }))
    expect(api.delete).not.toHaveBeenCalled()

    fireEvent.click(within(card).getByRole('button', { name: '삭제' }))
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2))
    expect(confirm).toHaveBeenCalledWith('이 일정을 삭제할까요?')
    expect(api.delete).toHaveBeenCalledWith('/api/admin/seminars/s1')
  })
})
