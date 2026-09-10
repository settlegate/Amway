import LeafIcon from './LeafIcon'

interface ChatMockProps {
  aiText?: string
  userText?: string
}

export default function ChatMock({
  aiText = '안녕하세요. 암웨이 웰니스 AI 컨설턴트입니다. 궁금한 점을 물어보세요.',
  userText = '피로 회복에 좋은 영양제 추천해주세요',
}: ChatMockProps) {
  return (
    <section className="chat-shell" aria-hidden="true">
      <div className="chat-head">
        <div className="ai-avatar">
          <LeafIcon size={20} />
        </div>
        <div>
          <strong>웰니스 AI 컨설턴트</strong>
          <small>
            <span className="status-dot" />
            <span>상담 가능</span>
          </small>
        </div>
      </div>
      <div className="chat-log">
        <div className="msg-row ai">
          <div className="avatar">
            <LeafIcon size={14} />
          </div>
          <div className="bubble">{aiText}</div>
          <span className="msg-time">15:55</span>
        </div>
        <div className="msg-row user">
          <div className="bubble">{userText}</div>
        </div>
      </div>
      <div className="chat-composer">
        <div className="fake-input">메시지를 입력하세요…</div>
        <div className="fake-btn">전송</div>
      </div>
    </section>
  )
}
