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

const QUICK_PROMPTS = [
  '피로 회복 영양제 추천',
  '단백질 보충 가이드',
  '아침 루틴 설계',
  '체성분 결과 해석',
]

function formatWon(price?: number) {
  if (typeof price !== 'number') return ''
  return `${price.toLocaleString('ko-KR')}원`
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
  const startedRef = useRef(false)

  const scrollToBottom = () => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }

  useEffect(() => {
    scrollToBottom()
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
          <div key={i}>
            <div className={`msg-row ${m.role}`}>
              {m.role === 'ai' && (
                <div className="avatar" aria-hidden="true">
                  <LeafIcon size={14} />
                </div>
              )}
              <div className="bubble">{m.text}</div>
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

      <div className="quick-chips" role="group" aria-label="빠른 질문">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => send(prompt, messages)}
            disabled={loading}
            aria-label={`질문 보내기: ${prompt}`}
          >
            {prompt}
          </button>
        ))}
      </div>

      <form className="chat-composer" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          id="chat-input"
          name="message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="예: 피로 회복에 도움되는 영양제 추천해주세요…"
          autoComplete="off"
          aria-label="메시지 입력"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? '전송 중…' : '전송'}
        </button>
      </form>
    </section>
  )
}
