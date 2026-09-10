import { useLocation } from 'react-router-dom'
import ChatPanel from '../components/ChatPanel'
import type { ChatMessage } from '../components/ChatPanel'

export default function Chat() {
  const location = useLocation()
  const initialMessages = (location.state as { messages?: ChatMessage[] } | null)?.messages

  return (
    <div className="page">
      <h2>건강 상담 챗봇</h2>
      <ChatPanel initialMessages={initialMessages} />
    </div>
  )
}
