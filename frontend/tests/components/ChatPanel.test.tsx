import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ChatPanel, { type ChatMessage } from '../../src/components/ChatPanel'
import { api } from '../../src/lib/api'
import { deferred, mockApiDefaults } from '../helpers/apiMock'

vi.mock('../../src/lib/api', () => import('../helpers/apiMock'))

const post = vi.mocked(api.post)
const FOOTER = '더 나은 건강 상담과 제품 추천은 정주희 ABO에게 문의하세요^^'
const GREETING = '안녕하세요. 암웨이 웰니스 AI 컨설턴트입니다. 궁금한 점을 물어보세요.'

const messageInput = () => screen.getByLabelText('메시지 입력')
const fileInput = (container: HTMLElement) => container.querySelector('input[type="file"]') as HTMLInputElement

function stubImage({ fail = false } = {}) {
  class FakeImage {
    onload: (() => void) | null = null
    onerror: ((e: unknown) => void) | null = null
    width = 2048
    height = 1024
    set src(_value: string) {
      setTimeout(() => (fail ? this.onerror?.(new Event('error')) : this.onload?.()))
    }
  }
  vi.stubGlobal('Image', FakeImage)
}

function stubCanvas(ctx: unknown) {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as any)
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,AAAA')
}

beforeEach(() => {
  mockApiDefaults()
  post.mockResolvedValue({ data: { text: '응답', products: [] } })
  vi.spyOn(window, 'open').mockImplementation(() => null)
  URL.createObjectURL = vi.fn(() => 'blob:mock')
})

describe('ChatPanel 기본 렌더링', () => {
  it('기본 인사말을 보여주고 입력창에 포커스한다', () => {
    render(<ChatPanel />)

    expect(screen.getByText(GREETING)).toBeInTheDocument()
    expect(messageInput()).toHaveFocus()
    expect(screen.getByRole('button', { name: '전송' })).toBeDisabled()
  })

  it('initialMessages가 비어 있으면 기본 인사말을 사용한다', () => {
    render(<ChatPanel initialMessages={[]} />)
    expect(screen.getByText(GREETING)).toBeInTheDocument()
  })

  it('전달된 대화와 체성분 결과 카드를 복원한다', () => {
    const initialMessages: ChatMessage[] = [
      { role: 'user', text: '이전 질문', createdAt: '2026-09-13T01:02:00Z' },
      { role: 'ai', text: '이전 답변', createdAt: new Date('2026-09-13T01:03:00Z'), bodyResult: { source: 'manual' } },
    ]

    const { container } = render(<ChatPanel initialMessages={initialMessages} />)

    expect(screen.queryByText(GREETING)).not.toBeInTheDocument()
    expect(screen.getByText('이전 질문')).toBeInTheDocument()
    expect(screen.getByText('10:02')).toBeInTheDocument()
    expect(screen.getByText('골격근량: - kg')).toBeInTheDocument()
    expect(screen.getByText('체형: -')).toBeInTheDocument()
    expect(container.querySelector('.body-result-card')).not.toHaveClass('is-invalid')
    expect(container.querySelector('.body-result-card small')).toBeNull()
    expect(container.querySelector('.sticky-question')).toHaveTextContent('이전 질문')
  })
})

describe('ChatPanel 메시지 전송', () => {
  it('Enter로 전송하고 답변과 추천 제품을 보여준다', async () => {
    post.mockResolvedValue({
      data: {
        text: `루테인 추천\n★ 영양소 정보\n<b>x</b> & more\n\n${FOOTER}`,
        products: [
          { id: 'p1', name: '루테인', description: '눈 건강', price: 30000, imageUrl: 'l.jpg', purchaseUrl: 'https://buy' },
          { id: 'p2', name: '오메가', aClicUrl: 'https://aclic' },
        ],
      },
    })
    const user = userEvent.setup()
    const { container } = render(<ChatPanel />)

    await user.type(messageInput(), '눈이 피로해요{Enter}')

    expect(post).toHaveBeenCalledWith('/api/chat', {
      message: '눈이 피로해요',
      history: [{ role: 'ai', text: GREETING }],
    })
    expect(await screen.findByText('루테인')).toBeInTheDocument()
    expect(screen.getByText('30,000원')).toBeInTheDocument()
    expect(messageInput()).toHaveValue('')

    expect(container.querySelector('.msg-footer')).toHaveTextContent(FOOTER)
    expect(container.querySelector('.nutrient-header')).toHaveTextContent('★ 영양소 정보')
    expect(container.innerHTML).toContain('&lt;b&gt;x&lt;/b&gt; &amp; more')

    const buttons = screen.getAllByRole('button', { name: '새창에서 제품 보기' })
    fireEvent.click(buttons[0])
    fireEvent.click(buttons[1])
    expect(window.open).toHaveBeenNthCalledWith(1, 'https://buy', '_blank', expect.any(String))
    expect(window.open).toHaveBeenNthCalledWith(2, 'https://aclic', '_blank', expect.any(String))
  })

  it('전송 버튼으로도 전송하고, 응답 대기 중에는 입력을 막는다', async () => {
    const pending = deferred<unknown>()
    post.mockReturnValue(pending.promise as any)
    const user = userEvent.setup()
    const { container } = render(<ChatPanel />)

    await user.type(messageInput(), '안녕')
    await user.click(screen.getByRole('button', { name: '전송' }))

    expect(screen.getByLabelText('답변을 작성 중입니다')).toBeInTheDocument()
    expect(messageInput()).toBeDisabled()
    expect(screen.getByRole('button', { name: '이미지 첨부' })).toBeDisabled()

    await act(async () => pending.resolve({ data: { text: '반가워요', products: null } }))

    expect(screen.getByText('반가워요')).toBeInTheDocument()
    expect(screen.queryByLabelText('답변을 작성 중입니다')).not.toBeInTheDocument()
    expect(container.querySelector('.product-list')).toBeNull()
    expect(messageInput()).toHaveFocus()
  })

  it('서버 오류 시 연결 안내 메시지를 보여준다', async () => {
    post.mockRejectedValue(new Error('network'))
    const user = userEvent.setup()
    render(<ChatPanel />)

    await user.type(messageInput(), '안녕{Enter}')

    expect(await screen.findByText(/서버에 연결할 수 없습니다/)).toBeInTheDocument()
  })

  it('빈 메시지, 한글 조합 중 Enter, 다른 키 입력은 전송하지 않는다', async () => {
    render(<ChatPanel />)

    fireEvent.keyDown(messageInput(), { key: 'Enter' })
    fireEvent.change(messageInput(), { target: { value: '조합 중' } })
    fireEvent.keyDown(messageInput(), { key: 'Enter', isComposing: true })
    fireEvent.keyDown(messageInput(), { key: 'a' })

    expect(post).not.toHaveBeenCalled()
  })

  it('initialQuestion이 있으면 마운트 시 한 번 자동 전송한다', async () => {
    post.mockResolvedValue({ data: { text: '답변', products: [] } })

    const { rerender } = render(<ChatPanel initialQuestion="피곤해요" />)
    rerender(<ChatPanel initialQuestion="피곤해요" />)

    expect(await screen.findByText('답변')).toBeInTheDocument()
    expect(post).toHaveBeenCalledTimes(1)
    expect(post.mock.calls[0][1]).toMatchObject({ message: '피곤해요' })
  })
})

describe('ChatPanel 체성분 분석', () => {
  it('initialQuestion이 체성분 키워드면 입력 방법 안내를 보여준다', () => {
    render(<ChatPanel initialQuestion=" 인바디 분석 " />)

    expect(screen.getByText('인바디 분석')).toBeInTheDocument()
    expect(screen.getByText('체성분 분석을 시작할게요.')).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })

  it.each(['enter', 'submit'])('체성분 키워드를 %s로 입력하면 안내를 보여준다', (mode) => {
    const { container } = render(<ChatPanel />)
    fireEvent.change(messageInput(), { target: { value: 'InBody 결과 봐줘' } })

    if (mode === 'enter') fireEvent.keyDown(messageInput(), { key: 'Enter' })
    else fireEvent.submit(container.querySelector('form')!)

    expect(screen.getByRole('button', { name: '수동 입력' })).toBeInTheDocument()
    expect(messageInput()).toHaveValue('')
    expect(post).not.toHaveBeenCalled()
  })

  it('수동 입력한 수치로 분석을 요청하고 결과 카드를 보여준다', async () => {
    post.mockResolvedValue({
      data: {
        text: '분석 결과입니다',
        products: [],
        bodyResult: { skeletalMuscleKg: 22, bodyFatPercent: 31, visceralFatLevel: 9, bodyType: '체지방 과다형', confidence: 'low', valid: false },
      },
    })
    render(<ChatPanel />)
    fireEvent.change(messageInput(), { target: { value: '체성분' } })
    fireEvent.keyDown(messageInput(), { key: 'Enter' })
    fireEvent.click(screen.getByRole('button', { name: '수동 입력' }))

    fireEvent.click(screen.getByRole('button', { name: '분석하기' }))
    expect(post).not.toHaveBeenCalled()

    fireEvent.change(screen.getByPlaceholderText('골격근량(kg)'), { target: { value: '22' } })
    fireEvent.change(screen.getByPlaceholderText('체지방률(%)'), { target: { value: '31' } })
    fireEvent.change(screen.getByPlaceholderText('내장지방'), { target: { value: '9' } })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '체지방 과다형' } })
    fireEvent.click(screen.getByRole('button', { name: '분석하기' }))

    expect(post.mock.calls[0][1]).toMatchObject({
      message: '',
      bodyMetrics: { skeletalMuscleKg: 22, bodyFatPercent: 31, visceralFatLevel: 9, bodyType: '체지방 과다형' },
    })
    expect(screen.getByText('체성분 수치를 분석해주세요')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '분석하기' })).not.toBeInTheDocument()

    expect(await screen.findByText('(low)')).toBeInTheDocument()
    expect(screen.getByText('골격근량: 22 kg')).toBeInTheDocument()
    expect(screen.getByText('체지방률: 31%')).toBeInTheDocument()
    expect(screen.getByText('내장지방: 9')).toBeInTheDocument()
    expect(screen.getByText(/수치 확인이 필요합니다/)).toBeInTheDocument()
  })

  it('체형만 선택해도 분석을 요청한다', () => {
    const { container } = render(<ChatPanel initialQuestion="체성분" />)
    fireEvent.click(screen.getByRole('button', { name: '수동 입력' }))

    fireEvent.change(container.querySelector('select')!, { target: { value: '균형형' } })
    fireEvent.click(screen.getByRole('button', { name: '분석하기' }))

    expect(post.mock.calls[0][1].bodyMetrics).toEqual({ bodyType: '균형형' })
  })

  it('이미지 첨부 버튼과 안내의 이미지 업로드 버튼은 파일 선택창을 연다', () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    render(<ChatPanel initialQuestion="체성분" />)

    fireEvent.click(screen.getByRole('button', { name: '이미지 첨부' }))
    fireEvent.click(screen.getByRole('button', { name: '이미지 업로드' }))

    expect(click).toHaveBeenCalledTimes(2)
  })

  it('선택한 이미지를 축소·보정해 분석을 요청한다', async () => {
    stubImage()
    const ctx = { filter: '', drawImage: vi.fn() }
    stubCanvas(ctx)
    post.mockResolvedValue({ data: { text: '이미지 분석', products: [], bodyResult: { bodyType: '균형형', confidence: 'high', valid: true } } })
    const { container } = render(<ChatPanel />)
    const input = fileInput(container)

    fireEvent.change(input, { target: { files: [new File(['img'], 'inbody.png', { type: 'image/png' })] } })

    await waitFor(() => expect(post).toHaveBeenCalled())
    expect(post.mock.calls[0][1]).toMatchObject({ message: '', imageBase64: 'AAAA', mimeType: 'image/jpeg' })
    expect(ctx.filter).toBe('contrast(1.2)')
    expect(ctx.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1024, 512)
    expect(screen.getByText('인바디 결과지를 분석해주세요')).toBeInTheDocument()
    expect(await screen.findByText('(high)')).toBeInTheDocument()
    expect(input.value).toBe('')
  })

  it('canvas 컨텍스트가 없어도 이미지를 전송한다', async () => {
    stubImage()
    stubCanvas(null)
    const { container } = render(<ChatPanel />)

    fireEvent.change(fileInput(container), { target: { files: [new File(['img'], 'a.png', { type: 'image/png' })] } })

    await waitFor(() => expect(post).toHaveBeenCalled())
  })

  it('이미지를 읽지 못하면 경고창을 띄운다', async () => {
    stubImage({ fail: true })
    stubCanvas(null)
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const { container } = render(<ChatPanel />)

    fireEvent.change(fileInput(container), { target: { files: [new File(['img'], 'a.png', { type: 'image/png' })] } })

    await waitFor(() => expect(alert).toHaveBeenCalledWith('이미지를 읽을 수 없습니다.'))
    expect(post).not.toHaveBeenCalled()
  })

  it('파일 선택을 취소하면 아무것도 하지 않는다', () => {
    const { container } = render(<ChatPanel />)

    fireEvent.change(fileInput(container), { target: { files: [] } })

    expect(post).not.toHaveBeenCalled()
  })

  it('클립보드의 이미지 파일만 붙여넣기로 전송한다', async () => {
    stubImage()
    stubCanvas(null)
    render(<ChatPanel />)
    const file = new File(['img'], 'paste.png', { type: 'image/png' })

    fireEvent.paste(messageInput())
    fireEvent.paste(messageInput(), {
      clipboardData: {
        items: [
          { kind: 'string', type: 'text/plain', getAsFile: () => null },
          { kind: 'file', type: 'application/pdf', getAsFile: () => file },
          { kind: 'file', type: 'image/png', getAsFile: () => null },
          { kind: 'file', type: 'image/png', getAsFile: () => file },
        ],
      },
    })

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1))
    expect(post.mock.calls[0][1]).toMatchObject({ imageBase64: 'AAAA' })
  })
})
