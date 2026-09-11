import { useLocation } from 'react-router-dom'
import ChatPanel from '../components/ChatPanel'
import type { ChatMessage } from '../components/ChatPanel'

export default function Chat() {
  const location = useLocation()
  const state = (location.state as { messages?: ChatMessage[]; initialQuestion?: string } | null) || null
  const initialMessages = state?.messages
  const initialQuestion = state?.initialQuestion

  return (
    <div className="page">
      <h2>건강 상담 챗봇</h2>
      <ChatPanel initialMessages={initialMessages} initialQuestion={initialQuestion} />
    </div>
  )
}
