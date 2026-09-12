import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import { openProductWindow } from '../lib/open'
import LeafIcon from './LeafIcon'
import UploadIcon from './UploadIcon'

interface ManualBodyValues {
  skeletalMuscleKg: string
  bodyFatPercent: string
  visceralFatLevel: string
  bodyType: string
}

export interface ChatProduct {
  id: string
  name: string
  description?: string
  price?: number
  imageUrl?: string
  purchaseUrl?: string
  aClicUrl?: string
}

export interface BodyResult {
  skeletalMuscleKg?: number
  bodyFatPercent?: number
  visceralFatLevel?: number
  bodyType?: string
  confidence?: 'high' | 'medium' | 'low'
  valid?: boolean
  source: 'image' | 'manual'
}

export interface ChatMessage {
  role: 'user' | 'ai'
  text: string
  products?: ChatProduct[]
  bodyResult?: BodyResult
  bodyPrompt?: boolean
  createdAt: Date | string
}

function formatWon(price?: number) {
  if (typeof price !== 'number') return ''
  return `${price.toLocaleString('ko-KR')}원`
}

const ABO_FOOTER = '더 나은 건강 상담과 제품 추천은 정주희 ABO에게 문의하세요^^'

const NUTRIENT_HEADER = '★ 영양소 정보'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function renderBubble(text: string, role: 'ai' | 'user') {
  if (role !== 'ai' || !text.includes(ABO_FOOTER)) {
    return <div className="bubble">{text}</div>
  }
  const index = text.lastIndexOf(ABO_FOOTER)
  const main = text.slice(0, index)
  const headerHtml = `<span class="nutrient-header">${NUTRIENT_HEADER}</span>`
  const html = escapeHtml(main)
    .replace(new RegExp(escapeHtml(NUTRIENT_HEADER), 'g'), headerHtml)
    .replace(/(?:\r\n|\r|\n)/g, '<br>')
  return (
    <div
      className="bubble"
      dangerouslySetInnerHTML={{
        __html: `${html}<br><br><strong class="msg-footer">${escapeHtml(ABO_FOOTER)}</strong>`,
      }}
    />
  )
}

function BodyPrompt({
  onUpload,
  onManual,
}: {
  onUpload: () => void
  onManual: () => void
}) {
  return (
    <div className="bubble body-prompt-bubble">
      <p>체성분 분석을 시작할게요.</p>
      <p>InBody 결과지 사진을 업로드하거나 수치를 직접 입력해주세요.</p>
      <div className="body-prompt-actions">
        <button type="button" onClick={onUpload} className="body-prompt-btn upload">
          이미지 업로드
        </button>
        <button type="button" onClick={onManual} className="body-prompt-btn manual">
          수동 입력
        </button>
      </div>
    </div>
  )
}

function toDate(date: Date | string) {
  return date instanceof Date ? date : new Date(date)
}

function formatTime(date: Date | string) {
  return toDate(date).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

const DEFAULT_MESSAGE: ChatMessage = {
  role: 'ai',
  text: '안녕하세요. 암웨이 웰니스 AI 컨설턴트입니다. 궁금한 점을 물어보세요.',
  createdAt: new Date(),
}

interface ChatPanelProps {
  initialMessages?: ChatMessage[]
  initialQuestion?: string
}

export default function ChatPanel({ initialMessages, initialQuestion }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages && initialMessages.length ? initialMessages : [DEFAULT_MESSAGE],
  )
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [manual, setManual] = useState<ManualBodyValues>({
    skeletalMuscleKg: '',
    bodyFatPercent: '',
    visceralFatLevel: '',
    bodyType: '',
  })
  const logRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const lastUserMessageRef = useRef<HTMLDivElement>(null)
  const startedRef = useRef(false)

  const scrollToLastUserMessage = () => {
    const log = logRef.current
    const el = lastUserMessageRef.current
    if (!log || !el) return
    const newScrollTop =
      el.getBoundingClientRect().top -
      log.getBoundingClientRect().top +
      log.scrollTop -
      12
    log.scrollTop = newScrollTop
  }

  useEffect(() => {
    scrollToLastUserMessage()
  }, [messages, loading])

  useEffect(() => {
    if (!loading && messages.length > 0) {
      inputRef.current?.focus()
    }
  }, [loading, messages])

  const send = async (text: string, history: ChatMessage[] = [], extra?: { imageBase64?: string; mimeType?: string; bodyMetrics?: Partial<BodyResult> }) => {
    const userMsg = text.trim()
    if (!userMsg && !extra?.imageBase64 && !extra?.bodyMetrics) return
    setInput('')
    const userText = userMsg || (extra?.imageBase64 ? '인바디 결과지를 분석해주세요' : '체성분 수치를 분석해주세요')
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: userText, createdAt: new Date() },
    ])
    setLoading(true)

    try {
      const payload: any = { message: userMsg, history: history.map((m) => ({ role: m.role, text: m.text })) }
      if (extra?.imageBase64) {
        payload.imageBase64 = extra.imageBase64
        payload.mimeType = extra.mimeType
      }
      if (extra?.bodyMetrics) {
        payload.bodyMetrics = extra.bodyMetrics
      }
      const { data } = await api.post('/api/chat', payload)
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: data.text,
          products: Array.isArray(data.products) ? data.products : [],
          bodyResult: data.bodyResult
            ? { ...data.bodyResult, source: extra?.imageBase64 ? 'image' : 'manual' }
            : undefined,
          createdAt: new Date(),
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: '서버에 연결할 수 없습니다. 터미널에서 `npm run dev`를 실행하여 백엔드(3001)가 켜져 있는지 확인해주세요.',
          createdAt: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialQuestion && !startedRef.current) {
      startedRef.current = true
      if (isBodyPromptKeyword(initialQuestion)) {
        showBodyPrompt(initialQuestion)
      } else {
        send(initialQuestion, messages)
      }
    }
  }, [initialQuestion])

  const isBodyPromptKeyword = (text: string) => /체성분|인바디|inbody|bodycomposition/i.test(text.trim())

  const showBodyPrompt = (text: string) => {
    setInput('')
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: text.trim(), createdAt: new Date() },
      {
        role: 'ai',
        text: '체성분 분석을 시작할게요. InBody 결과지 사진을 업로드하거나 수치를 직접 입력해주세요.',
        bodyPrompt: true,
        createdAt: new Date(),
      },
    ])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isBodyPromptKeyword(input)) {
      showBodyPrompt(input)
      return
    }
    send(input, messages)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault()
      if (isBodyPromptKeyword(input)) {
        showBodyPrompt(input)
        return
      }
      send(input, messages)
    }
  }

  const preprocessImage = (file: File, maxWidth = 1024): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width)
        canvas.width = Math.floor(img.width * scale)
        canvas.height = Math.floor(img.height * scale)
        if (ctx) {
          ctx.filter = 'contrast(1.2)'
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        }
        resolve({ base64: canvas.toDataURL('image/jpeg', 0.85).split(',')[1], mimeType: 'image/jpeg' })
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  const handleImage = async (file: File) => {
    try {
      const { base64, mimeType } = await preprocessImage(file)
      await send('', messages, { imageBase64: base64, mimeType })
    } catch {
      alert('이미지를 읽을 수 없습니다.')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleImage(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          e.preventDefault()
          handleImage(file)
        }
      }
    }
  }

  const handleManual = () => {
    const metrics: Partial<BodyResult> = {}
    if (manual.skeletalMuscleKg) metrics.skeletalMuscleKg = Number(manual.skeletalMuscleKg)
    if (manual.bodyFatPercent) metrics.bodyFatPercent = Number(manual.bodyFatPercent)
    if (manual.visceralFatLevel) metrics.visceralFatLevel = Number(manual.visceralFatLevel)
    if (manual.bodyType) metrics.bodyType = manual.bodyType
    if (Object.keys(metrics).length === 0) return
    send('', messages, { bodyMetrics: metrics })
    setManualOpen(false)
  }

  let lastUserIndex = -1
  messages.forEach((m, i) => {
    if (m.role === 'user') lastUserIndex = i
  })

  return (
    <section className="chat-shell" aria-label="건강 상담 챗봇">
      <div className="chat-head">
        <div className="ai-avatar" aria-hidden="true">
          <LeafIcon size={20} />
        </div>
        <div>
          <strong>웰니스 AI 컨설턴트</strong>
          <small>
            <span className="status-dot" aria-hidden="true" />
            <span>상담 가능</span>
          </small>
        </div>
      </div>

      <div
        ref={logRef}
        className="chat-log"
        role="log"
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions"
      >
        {messages.map((m, i) => (
          <div key={i} ref={i === lastUserIndex ? lastUserMessageRef : undefined}>
            <div className={`msg-row ${m.role}${i === lastUserIndex ? ' sticky-question' : ''}`}>
              {m.role === 'ai' && (
                <div className="avatar" aria-hidden="true">
                  <LeafIcon size={14} />
                </div>
              )}
              {m.bodyPrompt ? (
                <BodyPrompt
                  onUpload={() => fileRef.current?.click()}
                  onManual={() => setManualOpen(true)}
                />
              ) : (
                renderBubble(m.text, m.role)
              )}
              <span className="msg-time">{formatTime(m.createdAt)}</span>
            </div>

            {m.role === 'ai' && m.bodyResult && (
              <div className={`body-result-card ${m.bodyResult.valid === false ? 'is-invalid' : ''}`}>
                <h4>체성분 분석 결과 {m.bodyResult.confidence && <small>({m.bodyResult.confidence})</small>}</h4>
                <p>골격근량: {m.bodyResult.skeletalMuscleKg ?? '-'} kg</p>
                <p>체지방률: {m.bodyResult.bodyFatPercent ?? '-'}%</p>
                <p>내장지방: {m.bodyResult.visceralFatLevel ?? '-'}</p>
                <p>체형: {m.bodyResult.bodyType ?? '-'}</p>
                {m.bodyResult.valid === false && (
                  <p className="body-result-warning">수치 확인이 필요합니다. 정확한 결과는 전문의와 상담하세요.</p>
                )}
              </div>
            )}

            {m.role === 'ai' && m.products && m.products.length > 0 && (
              <div className="product-list">
                {m.products.map((p) => (
                  <div key={p.id} className="product-card">
                    <img
                      className="product-img"
                      src={p.imageUrl}
                      alt={p.name}
                      width={72}
                      height={72}
                      loading="lazy"
                    />
                    <div className="product-info">
                      <div className="product-name">{p.name}</div>
                      <div className="product-desc">{p.description}</div>
                      <div className="product-price">{formatWon(p.price)}</div>
                      <button
                        type="button"
                        onClick={() => openProductWindow(p.purchaseUrl || p.aClicUrl)}
                      >
                        새창에서 제품 보기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="msg-row ai">
            <div className="avatar" aria-hidden="true">
              <LeafIcon size={14} />
            </div>
            <div className="bubble" aria-label="답변을 작성 중입니다">
              <span className="typing" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </div>
          </div>
        )}
      </div>

      <form className="chat-composer" onSubmit={handleSubmit}>
        <input
          type="file"
          accept="image/*"
          ref={fileRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          aria-label="이미지 첨부"
          className="body-image-btn"
        >
          <UploadIcon size={20} />
        </button>
        <input
          ref={inputRef}
          id="chat-input"
          name="message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          autoComplete="off"
          aria-label="메시지 입력"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} aria-label="전송">
          <LeafIcon size={18} />
        </button>
      </form>

      {manualOpen && (
        <div className="body-manual-form">
          <input
            type="number"
            placeholder="골격근량(kg)"
            value={manual.skeletalMuscleKg}
            onChange={(e) => setManual((v) => ({ ...v, skeletalMuscleKg: e.target.value }))}
          />
          <input
            type="number"
            placeholder="체지방률(%)"
            value={manual.bodyFatPercent}
            onChange={(e) => setManual((v) => ({ ...v, bodyFatPercent: e.target.value }))}
          />
          <input
            type="number"
            placeholder="내장지방"
            value={manual.visceralFatLevel}
            onChange={(e) => setManual((v) => ({ ...v, visceralFatLevel: e.target.value }))}
          />
          <select
            value={manual.bodyType}
            onChange={(e) => setManual((v) => ({ ...v, bodyType: e.target.value }))}
          >
            <option value="">체형 선택</option>
            <option value="근육 부족형">근육 부족형</option>
            <option value="체지방 과다형">체지방 과다형</option>
            <option value="균형형">균형형</option>
          </select>
          <button type="button" onClick={handleManual} disabled={loading}>
            분석하기
          </button>
        </div>
      )}
    </section>
  )
}
