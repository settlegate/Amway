import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import { openProductWindow } from '../lib/open'
import LeafIcon from './LeafIcon'

export interface ChatProduct {
  id: string
  name: string
  description?: string
  price?: number
  imageUrl?: string
  purchaseUrl?: string
  aClicUrl?: string
}

export interface ChatMessage {
  role: 'user' | 'ai'
  text: string
  products?: ChatProduct[]
  createdAt: Date | string
}

function formatWon(price?: number) {
  if (typeof price !== 'number') return ''
  return `${price.toLocaleString('ko-KR')}원`
}

const ABO_FOOTER = '더 나은 건강 상담과 제품 추천은 정주희 ABO에게 문의하세요^^'

function renderBubble(text: string, role: 'ai' | 'user') {
  if (role !== 'ai' || !text.includes(ABO_FOOTER)) {
    return <div className="bubble">{text}</div>
  }
  const index = text.lastIndexOf(ABO_FOOTER)
  const main = text.slice(0, index)
  return (
    <div className="bubble">
      {main}
      <strong className="msg-footer">{ABO_FOOTER}</strong>
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
  const logRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
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

  const send = async (text: string, history: ChatMessage[] = []) => {
    const userMsg = text.trim()
    if (!userMsg) return
    setInput('')
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: userMsg, createdAt: new Date() },
    ])
    setLoading(true)

    try {
      const { data } = await api.post('/api/chat', { message: userMsg, history: history.map((m) => ({ role: m.role, text: m.text })) })
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: data.text,
          products: Array.isArray(data.products) ? data.products : [],
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
      send(initialQuestion, messages)
    }
  }, [initialQuestion])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    send(input, messages)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send(input, messages)
    }
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
            <div className={`msg-row ${m.role}`}>
              {m.role === 'ai' && (
                <div className="avatar" aria-hidden="true">
                  <LeafIcon size={14} />
                </div>
              )}
              {renderBubble(m.text, m.role)}
              <span className="msg-time">{formatTime(m.createdAt)}</span>
            </div>

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
          ref={inputRef}
          id="chat-input"
          name="message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          aria-label="메시지 입력"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} aria-label="전송">
          <LeafIcon size={18} />
        </button>
      </form>
    </section>
  )
}
